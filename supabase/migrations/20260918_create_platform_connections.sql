-- ============================================================================
-- Migration: create platform_connections table
-- ============================================================================
--
-- Cria a tabela `platform_connections` para armazenar as contas de plataformas
-- vinculadas a cada usuário do Chatteia.
--
-- Design:
--   - chatteia_user_id FK para auth.users (o usuário logado no Chatteia)
--   - platform é o identificador da plataforma (twitch, kick, youtube, tiktok)
--   - A chave composta (chatteia_user_id, platform) garante um registro por plataforma por usuário
--
-- Para migrar de Supabase:
--   Esta migration define apenas o schema SQL padrão.
--   O mesmo SQL funciona em qualquer PostgreSQL — sem funções ou extensions
--   específicas do Supabase.
-- ============================================================================

create table if not exists public.platform_connections (
    -- FK para o usuário do Chatteia
    chatteia_user_id uuid not null references auth.users(id) on delete cascade,

    -- Plataforma conectada
    platform text not null check (platform in ('twitch', 'kick', 'youtube', 'tiktok')),

    -- Username/canal na plataforma (ex: "turbao8")
    platform_username text not null,

    -- ID do broadcaster na plataforma (ex: "12345678")
    platform_user_id text not null,

    -- Quando a conexão foi criada/atualizada
    connected_at timestamptz not null default now(),

    -- Chave composta: um usuário só pode ter uma conexão por plataforma
    primary key (chatteia_user_id, platform)
);

-- Índice para busca rápida por usuário
create index if not exists platform_connections_user_idx
    on public.platform_connections (chatteia_user_id);

-- Índice para busca por plataforma+id (útil para moderação futura)
create index if not exists platform_connections_platform_user_idx
    on public.platform_connections (platform, platform_user_id);

-- ============================================================================
-- Row Level Security (RLS)
-- ============================================================================
-- Usuários só podem ler/modificar suas próprias conexões.
-- A escrita server-side usa supabaseAdmin (service_role) que bypassa o RLS.

alter table public.platform_connections enable row level security;

-- Política: usuário logado lê apenas suas próprias conexões
create policy "Users can read own platform connections"
    on public.platform_connections
    for select
    using (auth.uid() = chatteia_user_id);

-- A escrita (insert/update/delete) é feita exclusivamente pelo backend
-- via service_role (supabaseAdmin), que bypassa RLS. Não há política de write
-- para usuários do cliente.
