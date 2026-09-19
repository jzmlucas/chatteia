-- ============================================================================
-- Chatteia — schema para Postgres puro (sem Supabase)
-- ============================================================================
-- Substitui inteiramente: auth.users, auth.uid(), public.profiles,
-- public.platform_connections e a tabela de tokens da Kick, que antes
-- viviam no Supabase.
--
-- Autorização (quem pode ler/escrever o quê) agora é responsabilidade da
-- APLICAÇÃO (as rotas de API abaixo), não do Postgres via RLS — porque
-- `auth.uid()` era uma função exclusiva do Supabase, que não existe aqui.
-- ============================================================================

create extension if not exists pgcrypto; -- para gen_random_uuid()

-- ----------------------------------------------------------------------------
-- USERS (substitui auth.users + public.profiles em uma tabela só)
-- ----------------------------------------------------------------------------
create table if not exists users (
    id uuid primary key default gen_random_uuid(),

    email text not null unique,
    email_verified_at timestamptz,

    -- Nulo para contas criadas só via OAuth (sem senha própria).
    password_hash text,

    username text not null unique,
    display_name text,
    account_type text not null default 'user' check (account_type in ('user', 'streamer')),
    active_mode text not null default 'user' check (active_mode in ('user', 'streamer')),
    avatar_url text,
    bio text,

    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),

    constraint users_username_format check (username ~ '^[a-zA-Z0-9_]{3,20}$')
);

create index if not exists users_email_idx on users (lower(email));
create index if not exists users_username_idx on users (lower(username));

-- ----------------------------------------------------------------------------
-- SESSIONS (substitui os JWT/refresh tokens do Supabase Auth)
-- ----------------------------------------------------------------------------
-- Sessão "opaca" guardada no banco (não é um JWT autocontido). O cookie do
-- navegador guarda só o token; validamos e podemos revogar a qualquer
-- momento aqui — mais simples e mais seguro de operar sozinho do que
-- reimplementar rotação de refresh token de JWT.
create table if not exists sessions (
    token_hash text primary key, -- sha256(token) — nunca guardamos o token em claro
    user_id uuid not null references users(id) on delete cascade,
    created_at timestamptz not null default now(),
    expires_at timestamptz not null
);

create index if not exists sessions_user_id_idx on sessions (user_id);
create index if not exists sessions_expires_at_idx on sessions (expires_at);

-- ----------------------------------------------------------------------------
-- EMAIL VERIFICATION TOKENS
-- ----------------------------------------------------------------------------
create table if not exists email_verification_tokens (
    token_hash text primary key,
    user_id uuid not null references users(id) on delete cascade,
    created_at timestamptz not null default now(),
    expires_at timestamptz not null
);

create index if not exists email_verification_tokens_user_id_idx on email_verification_tokens (user_id);

-- ----------------------------------------------------------------------------
-- PASSWORD RESET TOKENS
-- ----------------------------------------------------------------------------
create table if not exists password_reset_tokens (
    token_hash text primary key,
    user_id uuid not null references users(id) on delete cascade,
    created_at timestamptz not null default now(),
    expires_at timestamptz not null
);

create index if not exists password_reset_tokens_user_id_idx on password_reset_tokens (user_id);

-- ----------------------------------------------------------------------------
-- OAUTH ACCOUNTS (login social — Google, Twitch, etc.)
-- ----------------------------------------------------------------------------
-- Independente das "platform_connections" (que são pra ler chat de
-- Twitch/Kick/YouTube/TikTok). Isso aqui é login/cadastro via OAuth.
create table if not exists oauth_accounts (
    provider text not null,
    provider_account_id text not null,
    user_id uuid not null references users(id) on delete cascade,
    created_at timestamptz not null default now(),

    primary key (provider, provider_account_id)
);

create index if not exists oauth_accounts_user_id_idx on oauth_accounts (user_id);

-- ----------------------------------------------------------------------------
-- PLATFORM CONNECTIONS (recriada aqui, sem depender de auth.users)
-- ----------------------------------------------------------------------------
create table if not exists platform_connections (
    chatteia_user_id uuid not null references users(id) on delete cascade,
    platform text not null,
    platform_username text not null,
    platform_user_id text not null,
    connected_at timestamptz not null default now(),

    primary key (chatteia_user_id, platform)
);

-- ----------------------------------------------------------------------------
-- KICK TOKENS (recriada com o schema real já usado por lib/platforms/kick)
-- ----------------------------------------------------------------------------
-- Atenção: esta tabela é por BROADCASTER DA KICK (para o fluxo de
-- assinatura de webhooks), não por usuário logado do Chatteia — por isso
-- não referencia `users(id)`.
create table if not exists kick_tokens (
    broadcaster_user_id text primary key,
    username text not null,
    access_token text not null,
    refresh_token text,
    token_type text not null default 'Bearer',
    expires_at bigint not null, -- epoch em milissegundos
    scope text[] not null default '{}',
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create index if not exists kick_tokens_username_idx on kick_tokens (lower(username));
