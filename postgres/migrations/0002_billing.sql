-- ============================================================================
-- Chatteia — cobrança (assinatura do streamer)
-- ============================================================================
-- Uma linha por usuário em `subscriptions`. O estado vem do provedor de
-- pagamento (Stripe) via webhook; a aplicação só LÊ esta tabela para decidir
-- se o usuário tem direito ao modo streamer (ver lib/billing/entitlements.ts).
--
-- `provider = 'manual'` permite conceder acesso sem cobrança (beta testers,
-- cortesias, você mesmo) inserindo uma linha à mão — veja o exemplo no fim.
-- ============================================================================

create table if not exists subscriptions (
    user_id uuid primary key references users(id) on delete cascade,

    provider text not null default 'stripe' check (provider in ('stripe', 'manual')),
    provider_customer_id text,
    provider_subscription_id text,

    plan text not null default 'streamer',
    price_id text,

    -- Guardamos o status "cru" do provedor (active, trialing, past_due,
    -- canceled, unpaid, incomplete, ...). Sem CHECK de propósito: o Stripe
    -- pode acrescentar valores e um CHECK faria o webhook falhar em produção.
    status text not null default 'incomplete',

    current_period_end timestamptz,
    trial_end timestamptz,
    cancel_at_period_end boolean not null default false,

    -- `created` do último evento do provedor aplicado nesta linha. Serve para
    -- descartar eventos que chegam fora de ordem (o Stripe não garante ordem).
    provider_event_at timestamptz,

    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),

    constraint subscriptions_stripe_needs_customer
        check (provider <> 'stripe' or provider_customer_id is not null)
);

create unique index if not exists subscriptions_provider_customer_idx
    on subscriptions (provider, provider_customer_id)
    where provider_customer_id is not null;

create unique index if not exists subscriptions_provider_subscription_idx
    on subscriptions (provider, provider_subscription_id)
    where provider_subscription_id is not null;

-- ----------------------------------------------------------------------------
-- BILLING EVENTS (idempotência do webhook)
-- ----------------------------------------------------------------------------
-- O Stripe reenvia eventos (timeout, 5xx). Gravamos o id do evento na MESMA
-- transação que aplica a mudança: se já existe, o evento é ignorado.
create table if not exists billing_events (
    provider text not null,
    event_id text not null,
    event_type text not null,
    received_at timestamptz not null default now(),

    primary key (provider, event_id)
);

-- ----------------------------------------------------------------------------
-- OPCIONAL — conceder acesso gratuito (não roda sozinho)
-- ----------------------------------------------------------------------------
-- Quem já usava o modo streamer antes da cobrança passa a precisar de
-- assinatura quando BILLING_ENFORCED=true. Para manter esses usuários com
-- acesso, rode UMA vez:
--
--   insert into subscriptions (user_id, provider, status, plan)
--   select id, 'manual', 'active', 'streamer'
--   from users
--   where account_type = 'streamer'
--   on conflict (user_id) do nothing;
--
-- Para um usuário específico (com data de validade opcional):
--
--   insert into subscriptions (user_id, provider, status, current_period_end)
--   values ('<uuid>', 'manual', 'active', now() + interval '1 year')
--   on conflict (user_id) do update
--     set provider = 'manual', status = 'active',
--         current_period_end = excluded.current_period_end;
