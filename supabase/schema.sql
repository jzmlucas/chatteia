-- =========================================================
-- Chatteia — Estrutura de cadastro/login (Supabase)
-- =========================================================
-- Como usar:
-- 1. Abra o painel do Supabase do projeto (https://ibkuzpvthrmclkhruwyf.supabase.co)
-- 2. Vá em "SQL Editor" -> "New query"
-- 3. Cole TODO este arquivo e clique em "Run"
--
-- O que isso cria:
-- - tabela public.profiles (1 linha por usuário, ligada a auth.users)
-- - tipo account_type: 'user' (espectador) ou 'streamer'
-- - trigger que cria o profile automaticamente quando alguém se cadastra
-- - índices e constraint de username único (case-insensitive)
-- - Row Level Security (RLS) com políticas de leitura/edição
-- =========================================================

-- Extensão usada para gerar UUID (normalmente já vem habilitada no Supabase)
create extension if not exists "pgcrypto";

-- Tipo de conta
do $$
begin
    if not exists (select 1 from pg_type where typname = 'account_type') then
        create type public.account_type as enum ('user', 'streamer');
    end if;
end
$$;

-- Tabela de perfis públicos, 1:1 com auth.users
create table if not exists public.profiles (
    id uuid primary key references auth.users (id) on delete cascade,
    username text not null,
    display_name text,
    account_type public.account_type not null default 'user',
    avatar_url text,
    bio text,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

-- username único, ignorando maiúsculas/minúsculas
create unique index if not exists profiles_username_lower_idx
    on public.profiles (lower(username));

create index if not exists profiles_account_type_idx
    on public.profiles (account_type);

-- Mantém updated_at sempre atualizado
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
    new.updated_at = now();
    return new;
end;
$$;

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
    before update on public.profiles
    for each row
    execute function public.set_updated_at();

-- Cria automaticamente um profile quando um novo usuário se cadastra
-- (os dados extras vêm de supabase.auth.signUp({ options: { data: {...} } }))
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
    insert into public.profiles (id, username, display_name, account_type)
    values (
        new.id,
        coalesce(
            new.raw_user_meta_data ->> 'username',
            split_part(new.email, '@', 1)
        ),
        coalesce(new.raw_user_meta_data ->> 'display_name', new.raw_user_meta_data ->> 'username'),
        coalesce((new.raw_user_meta_data ->> 'account_type')::public.account_type, 'user')
    )
    on conflict (id) do nothing;

    return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
    after insert on auth.users
    for each row
    execute function public.handle_new_user();

-- =========================================================
-- Row Level Security
-- =========================================================
alter table public.profiles enable row level security;

drop policy if exists "Profiles são públicos para leitura" on public.profiles;
create policy "Profiles são públicos para leitura"
    on public.profiles
    for select
    using (true);

drop policy if exists "Usuário edita apenas o próprio profile" on public.profiles;
create policy "Usuário edita apenas o próprio profile"
    on public.profiles
    for update
    using (auth.uid() = id)
    with check (auth.uid() = id);

-- Inserção normalmente acontece via trigger (security definer), mas liberamos
-- para o próprio usuário logado por segurança/compatibilidade.
drop policy if exists "Usuário cria o próprio profile" on public.profiles;
create policy "Usuário cria o próprio profile"
    on public.profiles
    for insert
    with check (auth.uid() = id);

-- =========================================================
-- Opcional, mas recomendado no painel do Supabase:
-- Authentication -> Providers -> Email
--   - Habilite "Email" como provider
--   - Se quiser exigir confirmação por e-mail, ligue "Confirm email"
--     (nesse caso, o login só funciona depois que o usuário clicar
--     no link recebido por e-mail)
-- Authentication -> URL Configuration
--   - Adicione http://localhost:3000/** e a URL de produção em
--     "Redirect URLs"
-- =========================================================
