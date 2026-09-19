/*
 * ============================================================================
 * POSTGRES IMPLEMENTATION
 * ============================================================================
 *
 * Esta é a ÚNICA camada que conhece o `pg`. Segue exatamente a mesma
 * interface que a implementação do Supabase seguia — o resto do código
 * (rotas de API que usam `platformConnectionRepo`) não mudou nada.
 *
 * Tabela: `platform_connections` (ver postgres/migrations/0001_init.sql)
 */

import { pool } from "@/lib/db/pool";
import type { ChatPlatform } from "@/lib/chat/types";
import type {
    PlatformConnection,
    PlatformConnectionRepository,
} from "./types";

type PlatformConnectionRow = {
    chatteia_user_id: string;
    platform: string;
    platform_username: string;
    platform_user_id: string;
    connected_at: string;
};

function rowToConnection(row: PlatformConnectionRow): PlatformConnection {
    return {
        chatteiaUserId: row.chatteia_user_id,
        platform: row.platform as ChatPlatform,
        platformUsername: row.platform_username,
        platformUserId: row.platform_user_id,
        connectedAt: new Date(row.connected_at),
    };
}

export class PostgresPlatformConnectionRepository
    implements PlatformConnectionRepository
{
    async findByUserId(chatteiaUserId: string): Promise<PlatformConnection[]> {
        const { rows } = await pool.query<PlatformConnectionRow>(
            `select * from platform_connections
             where chatteia_user_id = $1
             order by connected_at desc`,
            [chatteiaUserId]
        );

        return rows.map(rowToConnection);
    }

    async findByUserIdAndPlatform(
        chatteiaUserId: string,
        platform: ChatPlatform
    ): Promise<PlatformConnection | null> {
        const { rows } = await pool.query<PlatformConnectionRow>(
            `select * from platform_connections
             where chatteia_user_id = $1 and platform = $2
             limit 1`,
            [chatteiaUserId, platform]
        );

        return rows[0] ? rowToConnection(rows[0]) : null;
    }

    async save(connection: PlatformConnection): Promise<void> {
        await pool.query(
            `insert into platform_connections
                 (chatteia_user_id, platform, platform_username, platform_user_id, connected_at)
             values ($1, $2, $3, $4, $5)
             on conflict (chatteia_user_id, platform)
             do update set
                 platform_username = excluded.platform_username,
                 platform_user_id = excluded.platform_user_id,
                 connected_at = excluded.connected_at`,
            [
                connection.chatteiaUserId,
                connection.platform,
                connection.platformUsername,
                connection.platformUserId,
                connection.connectedAt.toISOString(),
            ]
        );
    }

    async deleteByUserIdAndPlatform(
        chatteiaUserId: string,
        platform: ChatPlatform
    ): Promise<void> {
        await pool.query(
            `delete from platform_connections
             where chatteia_user_id = $1 and platform = $2`,
            [chatteiaUserId, platform]
        );
    }
}
