/*
 * ============================================================================
 * POSTGRES IMPLEMENTATION
 * ============================================================================
 * Única camada que fala SQL com `giveaways`. Tabela: 1 linha por streamer
 * dono do sorteio (ver postgres/migrations/0003_giveaways.sql).
 */

import { pool } from "@/lib/db/pool";
import type { GiveawayRow, GiveawayStatus, GiveawayWinner } from "@/types/giveaway";

import type { GiveawayRepository, UpsertGiveawayInput } from "./types";

export class PostgresGiveawayRepository implements GiveawayRepository {
    async findByOwner(ownerUserId: string): Promise<GiveawayRow | null> {
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
            `insert into giveaways (owner_user_id, trigger, channels)
             values ($1, $2, $3::jsonb)
             on conflict (owner_user_id) do update set
                 trigger = excluded.trigger,
                 channels = excluded.channels,
                 -- Mudou a config? Volta pra rascunho: evita um sorteio
                 -- "aberto" com uma lista de canais que ninguém revisou.
                 status = 'draft',
                 winner = null,
                 opened_at = null,
                 closed_at = null,
                 updated_at = now()
             returning *`,
            [ownerUserId, input.trigger, JSON.stringify(input.channels)]
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
                 opened_at = case when $2 = 'open' then now() else opened_at end,
                 closed_at = case when $2 = 'closed' then now() else closed_at end,
                 updated_at = now()
             where owner_user_id = $1
             returning *`,
            [ownerUserId, status, winner ? JSON.stringify(winner) : null]
        );

        return rows[0] ?? null;
    }

    async delete(ownerUserId: string): Promise<void> {
        await pool.query("delete from giveaways where owner_user_id = $1", [
            ownerUserId,
        ]);
    }
}
