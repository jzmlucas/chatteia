import { pool } from "@/lib/db/pool";
import type { ChatTarget } from "@/lib/chat/targets";

import type { ObsLinkRepository, ObsMultiChatLinkRow } from "./types";

export class PostgresObsLinkRepository implements ObsLinkRepository {
    async findByTokenHash(
        tokenHash: string
    ): Promise<ObsMultiChatLinkRow | null> {
        const { rows } = await pool.query<ObsMultiChatLinkRow>(
            "select * from obs_multi_chat_links where token_hash = $1 limit 1",
            [tokenHash]
        );

        return rows[0] ?? null;
    }

    async rotate(
        ownerUserId: string,
        tokenHash: string,
        channels: ChatTarget[]
    ): Promise<ObsMultiChatLinkRow> {
        const { rows } = await pool.query<ObsMultiChatLinkRow>(
            `insert into obs_multi_chat_links (owner_user_id, token_hash, channels)
             values ($1, $2, $3::jsonb)
             on conflict (owner_user_id) do update set
                 token_hash = excluded.token_hash,
                 channels = excluded.channels,
                 updated_at = now()
             returning *`,
            [ownerUserId, tokenHash, JSON.stringify(channels)]
        );

        return rows[0];
    }

    async delete(ownerUserId: string): Promise<void> {
        await pool.query(
            "delete from obs_multi_chat_links where owner_user_id = $1",
            [ownerUserId]
        );
    }
}
