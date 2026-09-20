import type Stripe from "stripe";

import { PLAN_KEY } from "@/lib/billing/config";
import { hasStreamerAccess } from "@/lib/billing/entitlements";
import {
    applyStripeSubscription,
    findUserIdByCustomerId,
    recordBillingEvent,
    userExists,
} from "@/lib/billing/subscriptions";
import { pool } from "@/lib/db/pool";

/**
 * Eventos que carregam um objeto Subscription completo. O estado vem do
 * PRÓPRIO evento (sem chamadas extras à API do Stripe); a ordem é garantida
 * por `provider_event_at`. `checkout.session.completed` não é necessário: o
 * vínculo usuário<->customer é gravado ao criar o checkout, e o status chega
 * em `customer.subscription.created`.
 */
const SUBSCRIPTION_EVENTS = new Set<string>([
    "customer.subscription.created",
    "customer.subscription.updated",
    "customer.subscription.deleted",
    "customer.subscription.paused",
    "customer.subscription.resumed",
]);

const UUID_REGEX =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export type StripeEventResult = "applied" | "duplicate" | "ignored";

function toDate(seconds: number | null | undefined): Date | null {
    return typeof seconds === "number" ? new Date(seconds * 1000) : null;
}

/** Desde a API "basil" o fim do período fica nos ITENS, não na assinatura. */
function getPeriodEnd(subscription: Stripe.Subscription): Date | null {
    let latest: number | null = null;

    for (const item of subscription.items.data) {
        if (latest === null || item.current_period_end > latest) {
            latest = item.current_period_end;
        }
    }

    return toDate(latest);
}

export async function handleStripeEvent(
    event: Stripe.Event
): Promise<StripeEventResult> {
    if (!SUBSCRIPTION_EVENTS.has(event.type)) {
        return "ignored";
    }

    const subscription = event.data.object as Stripe.Subscription;

    const customerId =
        typeof subscription.customer === "string"
            ? subscription.customer
            : subscription.customer.id;

    const client = await pool.connect();

    try {
        await client.query("BEGIN");

        // Idempotência: gravado na mesma transação que aplica a mudança.
        // Se algo falhar abaixo, o ROLLBACK desfaz este registro também e o
        // reenvio do Stripe é processado normalmente.
        const isNew = await recordBillingEvent(
            "stripe",
            event.id,
            event.type,
            client
        );

        if (!isNew) {
            await client.query("COMMIT");
            return "duplicate";
        }

        let userId = await findUserIdByCustomerId(customerId, client);

        if (!userId) {
            const fromMetadata = subscription.metadata?.user_id;

            if (
                fromMetadata &&
                UUID_REGEX.test(fromMetadata) &&
                (await userExists(fromMetadata, client))
            ) {
                userId = fromMetadata;
            }
        }

        if (!userId) {
            // Assinatura criada fora do nosso fluxo (ex.: direto no painel do
            // Stripe, sem metadata). Não há a quem atribuir: registramos e
            // seguimos com 200 para o Stripe não ficar reenviando.
            console.warn(
                `[BILLING] Evento ${event.id} (${event.type}) sem usuário associado ` +
                    `(customer ${customerId}). Ignorado.`
            );

            await client.query("COMMIT");
            return "ignored";
        }

        const row = await applyStripeSubscription(
            {
                userId,
                customerId,
                subscriptionId: subscription.id,
                plan: PLAN_KEY,
                priceId: subscription.items.data[0]?.price?.id ?? null,
                status: subscription.status,
                currentPeriodEnd: getPeriodEnd(subscription),
                trialEnd: toDate(subscription.trial_end),
                cancelAtPeriodEnd: subscription.cancel_at_period_end,
                eventAt: new Date(event.created * 1000),
            },
            client
        );

        if (!row) {
            console.warn(
                `[BILLING] Evento ${event.id} (${event.type}) descartado ` +
                    "(fora de ordem ou de outra assinatura)."
            );

            await client.query("COMMIT");
            return "ignored";
        }

        // Perdeu o direito? Tira do modo streamer agora, em vez de esperar o
        // próximo carregamento de sessão. (Com BILLING_ENFORCED desligado
        // hasStreamerAccess é sempre true, então nada é rebaixado.)
        if (!hasStreamerAccess(row)) {
            await client.query(
                `update users
                 set active_mode = 'user', updated_at = now()
                 where id = $1 and active_mode = 'streamer'`,
                [userId]
            );
        }

        await client.query("COMMIT");

        console.log(
            `[BILLING] ${event.type} aplicado: user=${userId} status=${row.status}`
        );

        return "applied";
    } catch (error) {
        await client.query("ROLLBACK").catch(() => undefined);
        throw error;
    } finally {
        client.release();
    }
}
