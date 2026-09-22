-- ============================================================================
-- Chatteia — link assinado do overlay multi-chat (OBS)
-- ============================================================================
-- /obs/multi-chat é carregado dentro do OBS como Browser Source, então não
-- tem cookie de sessão (é um CEF isolado, sem login). Por isso o controle de
-- acesso não pode ser "usuário logado" — é "token opaco imprevisível",
-- igual ao padrão já usado em `sessions` (ver lib/auth/tokens.ts): só o hash
-- fica no banco, o valor cru só existe no link copiado pelo streamer.
--
-- Uma linha por streamer (igual `giveaways`/`subscriptions`): gerar um novo
-- link substitui o anterior — é assim que o streamer revoga um link que
-- vazou (ex.: apareceu sem querer em um VOD), sem precisar de endpoint de
-- "revogar" separado.
-- ============================================================================

create table if not exists obs_multi_chat_links (
    owner_user_id uuid primary key references users(id) on delete cascade,

    -- sha256 do token cru (ver lib/auth/tokens.ts hashToken). Nunca
    -- guardamos o token em texto puro.
    token_hash text not null unique,

    -- ["twitch:fulano", "kick:beltrano", ...] — mesmo formato de
    -- `targetKey()` em lib/chat/targets.ts, já validado por
    -- `normalizeChatTarget()` antes de chegar aqui.
    channels jsonb not null default '[]'::jsonb,

    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),

    constraint obs_multi_chat_links_channels_is_array
        check (jsonb_typeof(channels) = 'array')
);
