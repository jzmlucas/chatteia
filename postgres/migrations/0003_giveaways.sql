-- ============================================================================
-- Chatteia — sorteios multiplataforma
-- ============================================================================
-- Uma linha por streamer dono do sorteio (mesmo padrão de `subscriptions`:
-- 1 registro por usuário, upsert em cima da PK). `channels` guarda a lista de
-- canais participantes (do próprio dono + de outros streamers convidados),
-- cada um com plataforma + nome de canal, para que uma ÚNICA trigger de chat
-- valha para todos os canais simultaneamente.
--
-- Ficou em jsonb (em vez de tabela filha) de propósito: a lista é pequena
-- (MAX_GIVEAWAY_CHANNELS, ver types/giveaway.ts), é sempre lida/escrita por
-- inteiro junto com o registro do sorteio, e não precisa de índice próprio
-- agora. Se depois for preciso consultar "em quais sorteios o canal X está"
-- (para o listener de chat encontrar sorteios abertos por canal), promova
-- para uma tabela `giveaway_channels` — a MIGRATION seguinte já teria o
-- padrão pronto em `platform_connections`.
-- ============================================================================

create table if not exists giveaways (
    owner_user_id uuid primary key references users(id) on delete cascade,

    -- Comando de chat que conta como participação (ex.: "!sorteio").
    trigger text not null default '!sorteio',

    -- draft  = configurado, mas o sorteio não está recebendo entradas.
    -- open   = aceitando entradas nos canais listados agora.
    -- closed = encerrado; `winner` (se houver) guarda o resultado.
    status text not null default 'draft'
        check (status in ('draft', 'open', 'closed')),

    -- [{ "platform": "twitch", "channelName": "fulano" }, ...]
    -- Sempre inclui o canal do próprio dono; os demais são convidados
    -- (streamers de outras plataformas fazendo a live em conjunto).
    channels jsonb not null default '[]'::jsonb,

    -- { "platform": "...", "channelName": "...", "username": "..." } | null
    winner jsonb,

    opened_at timestamptz,
    closed_at timestamptz,

    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),

    constraint giveaways_channels_is_array
        check (jsonb_typeof(channels) = 'array')
);
