import type { Pool, PoolClient } from "pg";

import { pool } from "@/lib/db/pool";

import type { SubscriptionRow } from "@/types/billing";

/*
 * Única camada que fala SQL com `subscriptions` / `billing_events`.
 * Todas as funções aceitam um `db` opcional para rodar dentro de uma
 * transação (ver lib/billing/webhook.ts).
 */

type Queryable = Pick<Pool | PoolClient, "query">;

export async function findSubscriptionByUserId(
    userId: string,
    db: Queryable = pool
): Promise<SubscriptionRow | null> {
    const { rows } = await db.query<SubscriptionRow>(
        "select * from subscriptions where user_id = $1 limit 1",
        [userId]
    );

    return rows[0] ?? null;
}

export async function findUserIdByCustomerId(
    customerId: string,
    db: Queryable = pool
): Promise<string | null> {
    const { rows } = await db.query<{ user_id: string }>(
        `select user_id from subscriptions
         where provider = 'stripe' and provider_customer_id = $1
         limit 1`,
        [customerId]
    );

    return rows[0]?.user_id ?? null;
}

export async function userExists(
    userId: string,
    db: Queryable = pool
): Promise<boolean> {
    const { rows } = await db.query(
        "select 1 from users where id = $1 limit 1",
        [userId]
    );

    return rows.length > 0;
}

/**
 * Garante que o usuário tenha um customer do Stripe registrado.
 *
 * - Sem linha: cria (status "incomplete").
 * - Linha com customer: mantém (reaproveita o customer de assinaturas antigas).
 * - Linha sem customer (cortesia manual vencida): vira uma linha Stripe limpa.
 *
 * Devolve sempre a linha final.
 */
export async function ensureStripeCustomer(
    userId: string,
    customerId: string,
    db: Queryable = pool
): Promise<SubscriptionRow> {
    await db.query(
        `insert into subscriptions
             (user_id, provider, provider_customer_id, status)
         values ($1, 'stripe', $2, 'incomplete')
         on conflict (user_id) do update set
             provider = 'stripe',
             provider_customer_id = excluded.provider_customer_id,
             provider_subscription_id = null,
             status = 'incomplete',
             current_period_end = null,
             trial_end = null,
             cancel_at_period_end = false,
             updated_at = now()
         where subscriptions.provider_customer_id is null`,
        [userId, customerId]
    );

    const row = await findSubscriptionByUserId(userId, db);

    if (!row) {
        throw new Error("Linha de assinatura não encontrada após upsert.");
    }

    return row;
}

export type StripeSubscriptionSnapshot = {
    userId: string;
    customerId: string;
    subscriptionId: string;
    plan: string;
    priceId: string | null;
    status: string;
    currentPeriodEnd: Date | null;
    trialEnd: Date | null;
    cancelAtPeriodEnd: boolean;
    /** `created` do evento do Stripe que trouxe este estado. */
    eventAt: Date;
};

/**
 * Aplica o estado de uma assinatura do Stripe. Devolve a linha resultante,
 * ou `null` se o evento foi descartado por ser:
 *   - mais antigo que o último já aplicado (Stripe não garante ordem); ou
 *   - de OUTRA assinatura enquanto a atual ainda está viva (ex.: o
 *     "deleted" atrasado de uma assinatura antiga não pode derrubar a nova).
 */
export async function applyStripeSubscription(
    snapshot: StripeSubscriptionSnapshot,
    db: Queryable = pool
): Promise<SubscriptionRow | null> {
    const { rows } = await db.query<SubscriptionRow>(
        `insert into subscriptions (
             user_id, provider, provider_customer_id, provider_subscription_id,
             plan, price_id, status, current_period_end, trial_end,
             cancel_at_period_end, provider_event_at
         )
         values ($1, 'stripe', $2, $3, $4, $5, $6, $7, $8, $9, $10)
         on conflict (user_id) do update set
             provider = 'stripe',
             provider_customer_id = excluded.provider_customer_id,
             provider_subscription_id = excluded.provider_subscription_id,
             plan = excluded.plan,
             price_id = excluded.price_id,
             status = excluded.status,
             current_period_end = excluded.current_period_end,
             trial_end = excluded.trial_end,
             cancel_at_period_end = excluded.cancel_at_period_end,
             provider_event_at = excluded.provider_event_at,
             updated_at = now()
         where
             (subscriptions.provider_event_at is null
              or subscriptions.provider_event_at <= excluded.provider_event_at)
             and
             (subscriptions.provider_subscription_id is null
              or subscriptions.provider_subscription_id = excluded.provider_subscription_id
              or subscriptions.status in ('canceled', 'incomplete_expired'))
         returning *`,
        [
            snapshot.userId,
            snapshot.customerId,
            snapshot.subscriptionId,
            snapshot.plan,
            snapshot.priceId,
            snapshot.status,
            snapshot.currentPeriodEnd,
            snapshot.trialEnd,
            snapshot.cancelAtPeriodEnd,
            snapshot.eventAt,
        ]
    );

    return rows[0] ?? null;
}

/** true = evento novo; false = já processado antes (duplicado). */
export async function recordBillingEvent(
    provider: string,
    eventId: string,
    eventType: string,
    db: Queryable = pool
): Promise<boolean> {
    const { rowCount } = await db.query(
        `insert into billing_events (provider, event_id, event_type)
         values ($1, $2, $3)
         on conflict do nothing`,
        [provider, eventId, eventType]
    );

    return (rowCount ?? 0) > 0;
}
