import { isBillingEnforced } from "@/lib/billing/config";
import type { SubscriptionRow } from "@/types/billing";

/*
 * ============================================================================
 * REGRA ÚNICA de "quem pode usar o modo streamer".
 * Tudo (rotas de API, sessão, UI) decide por aqui — não replique esta lógica.
 * ============================================================================
 */

/**
 * `past_due` = a última cobrança falhou e o Stripe ainda está tentando de
 * novo. Mantemos o acesso (o cliente não perde o overlay no meio da live por
 * um cartão recusado), limitado pela tolerância abaixo.
 */
const ENTITLED_STATUSES = new Set(["active", "trialing", "past_due"]);

/**
 * Folga após o fim do período: a renovação paga chega por webhook alguns
 * segundos depois de `current_period_end`; sem folga haveria uma janela em
 * que quem acabou de renovar perde o acesso. Também limita o `past_due`.
 */
export const PERIOD_GRACE_MS = 3 * 24 * 60 * 60 * 1000;

export function isSubscriptionEntitled(
    subscription: Pick<SubscriptionRow, "status" | "current_period_end"> | null,
    now: number = Date.now()
): boolean {
    if (!subscription) {
        return false;
    }

    if (!ENTITLED_STATUSES.has(subscription.status)) {
        return false;
    }

    // Sem data de fim (ex.: cortesia manual sem validade): não expira.
    if (!subscription.current_period_end) {
        return true;
    }

    return subscription.current_period_end.getTime() + PERIOD_GRACE_MS > now;
}

/**
 * O usuário pode usar o modo streamer? Com BILLING_ENFORCED desligado,
 * sempre sim (comportamento anterior à cobrança).
 */
export function hasStreamerAccess(
    subscription: Pick<SubscriptionRow, "status" | "current_period_end"> | null,
    now: number = Date.now()
): boolean {
    if (!isBillingEnforced()) {
        return true;
    }

    return isSubscriptionEntitled(subscription, now);
}
