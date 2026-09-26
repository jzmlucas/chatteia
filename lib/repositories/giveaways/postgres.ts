/*
 * ============================================================================
 * POSTGRES IMPLEMENTATION
 * ============================================================================
 * Única camada que fala SQL com `giveaways`. Tabela: 1 linha por streamer
 * dono do sorteio (ver postgres/migrations/0003_giveaways.sql).
 */

import { pool } from "@/lib/db/pool";
import type { GiveawayParticipant, GiveawayRow, GiveawayStatus, GiveawayWinner } from "@/types/giveaway";

import type { GiveawayRepository, UpsertGiveawayInput } from "./types";

export class PostgresGiveawayRepository implements GiveawayRepository {
    async findByOwner(ownerUserId: string): Promise<GiveawayRow | null> {
        await pool.query(
            `update giveaways set status = 'closed', closed_at = coalesce(closed_at, now()), updated_at = now()
             where owner_user_id = $1 and status = 'open' and deadline_at is not null and deadline_at <= now()`,
            [ownerUserId]
        );

        const { rows } = await pool.query<GiveawayRow>(
            "select * from giveaways where owner_user_id = $1 limit 1",
            [ownerUserId]
        );

        return rows[0] ?? null;
    }

    async upsert(
        ownerUserId: string,
        input: UpsertGiveawayInput
    ): Promise<GiveawayRow> {
        const { rows } = await pool.query<GiveawayRow>(
            `insert into giveaways (owner_user_id, trigger, channels, duration_seconds)
             values ($1, $2, $3::jsonb, $4)
             on conflict (owner_user_id) do update set
                 trigger = excluded.trigger,
                 channels = excluded.channels,
                 duration_seconds = excluded.duration_seconds,
                 -- Mudou a config? Volta pra rascunho: evita um sorteio
                 -- "aberto" com uma lista de canais que ninguém revisou.
                 status = 'draft',
                 winner = null,
                 opened_at = null,
                 closed_at = null,
                 updated_at = now()
             returning *`,
            [ownerUserId, input.trigger, JSON.stringify(input.channels), input.durationSeconds]
        );

        return rows[0];
    }

    async updateStatus(
        ownerUserId: string,
        status: GiveawayStatus,
        winner: GiveawayWinner | null = null
    ): Promise<GiveawayRow | null> {
        const { rows } = await pool.query<GiveawayRow>(
            `update giveaways set
                 status = $2,
                 winner = $3::jsonb,
                 participants = case when $2 = 'open' then '[]'::jsonb else participants end,
                 opened_at = case when $2 = 'open' then now() else opened_at end,
                 closed_at = case when $2 = 'closed' then now() else closed_at end,
                 deadline_at = case when $2 = 'open' and duration_seconds is not null
                     then now() + make_interval(secs => duration_seconds) else null end,
                 updated_at = now()
             where owner_user_id = $1
             returning *`,
            [ownerUserId, status, winner ? JSON.stringify(winner) : null]
        );

        return rows[0] ?? null;
    }

    async findOpenByChannel(
        platform: GiveawayParticipant["platform"],
        channelName: string
    ): Promise<GiveawayRow[]> {
        const { rows } = await pool.query<GiveawayRow>(
            `select * from giveaways
             where status = 'open'
               and (deadline_at is null or deadline_at > now())`
        );

        return rows.filter((row) => row.channels.some((channel) =>
            channel.platform === platform &&
            channel.channelName.toLowerCase() === channelName.toLowerCase()
        ));
    }

    async addParticipant(input: {
        giveaway: GiveawayRow;
        username: string;
        displayName: string;
        platform: GiveawayParticipant["platform"];
        channelName: string;
    }): Promise<GiveawayRow | null> {
        const participant: GiveawayParticipant = {
            username: input.username,
            displayName: input.displayName,
            platform: input.platform,
            channelName: input.channelName,
            joinedAt: new Date().toISOString(),
        };

        const { rows } = await pool.query<GiveawayRow>(
            `update giveaways
             set participants = case
                 when exists (
                     select 1 from jsonb_array_elements(participants) item
                     where lower(item->>'username') = lower($2)
                       and item->>'platform' = $3
                 ) then participants
                 else participants || $4::jsonb end,
                 updated_at = now()
             where owner_user_id = $1
               and status = 'open'
               and (deadline_at is null or deadline_at > now())
             returning *`,
            [input.giveaway.owner_user_id, input.username, input.platform, JSON.stringify([participant])]
        );

        return rows[0] ?? null;
    }

    async delete(ownerUserId: string): Promise<void> {
        await pool.query("delete from giveaways where owner_user_id = $1", [
            ownerUserId,
        ]);
    }
}
