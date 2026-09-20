export type SubscriptionProvider = "stripe" | "manual";

export type BillingInterval = "month" | "year";

/**
 * Linha da tabela `subscriptions` (ver postgres/migrations/0002_billing.sql).
 * Nunca é enviada inteira ao navegador — use `toSubscriptionSummary`.
 */
export type SubscriptionRow = {
    user_id: string;
    provider: SubscriptionProvider;
    provider_customer_id: string | null;
    provider_subscription_id: string | null;
    plan: string;
    price_id: string | null;
    status: string;
    current_period_end: Date | null;
    trial_end: Date | null;
    cancel_at_period_end: boolean;
    provider_event_at: Date | null;
    created_at: Date;
    updated_at: Date;
};

/** O que o navegador precisa saber da assinatura (sem ids do provedor). */
export type SubscriptionSummary = {
    provider: SubscriptionProvider;
    plan: string;
    status: string;
    currentPeriodEnd: string | null;
    trialEnd: string | null;
    cancelAtPeriodEnd: boolean;
};

export type BillingState = {
    /** BILLING_ENFORCED=true: o modo streamer exige assinatura. */
    enforced: boolean;
    /** O usuário pode usar o modo streamer agora (já considera `enforced`). */
    entitled: boolean;
    /** Existe assinatura viva de fato (independe de `enforced`). */
    subscribed: boolean;
    subscription: SubscriptionSummary | null;
};

export type PlanPrice = {
    interval: BillingInterval;
    amount: number; // menor unidade da moeda (centavos)
    currency: string; // ISO minúsculo, ex.: "brl"
};

export type PlanInfo = {
    enabled: boolean;
    enforced: boolean;
    trialDays: number;
    prices: PlanPrice[];
};

export function toSubscriptionSummary(
    row: SubscriptionRow | null
): SubscriptionSummary | null {
    if (!row) {
        return null;
    }

    return {
        provider: row.provider,
        plan: row.plan,
        status: row.status,
        currentPeriodEnd: row.current_period_end
            ? row.current_period_end.toISOString()
            : null,
        trialEnd: row.trial_end ? row.trial_end.toISOString() : null,
        cancelAtPeriodEnd: row.cancel_at_period_end,
    };
}
