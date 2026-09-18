/*
 * ============================================================================
 * SUPABASE IMPLEMENTATION
 * ============================================================================
 *
 * Esta é a ÚNICA camada que conhece o Supabase.
 * Para migrar de banco, crie outro arquivo (ex: prisma.ts) com a mesma
 * interface e troque a exportação em index.ts.
 *
 * Tabela utilizada: `platform_connections`
 * Coluna chatteia_user_id referencia auth.users(id).
 */

import { supabaseAdmin } from "@/lib/supabase/server";
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

export class SupabasePlatformConnectionRepository
    implements PlatformConnectionRepository
{
    private readonly TABLE = "platform_connections";

    async findByUserId(chatteiaUserId: string): Promise<PlatformConnection[]> {
        const { data, error } = await supabaseAdmin
            .from(this.TABLE)
            .select("*")
            .eq("chatteia_user_id", chatteiaUserId)
            .order("connected_at", { ascending: false });

        if (error) {
            console.error("[PlatformConnections] findByUserId error:", error);
            throw new Error(`Failed to find platform connections: ${error.message}`);
        }

        return (data ?? []).map((row) => rowToConnection(row as PlatformConnectionRow));
    }

    async findByUserIdAndPlatform(
        chatteiaUserId: string,
        platform: ChatPlatform
    ): Promise<PlatformConnection | null> {
        const { data, error } = await supabaseAdmin
            .from(this.TABLE)
            .select("*")
            .eq("chatteia_user_id", chatteiaUserId)
            .eq("platform", platform)
            .maybeSingle();

        if (error) {
            console.error("[PlatformConnections] findByUserIdAndPlatform error:", error);
            throw new Error(`Failed to find platform connection: ${error.message}`);
        }

        if (!data) return null;

        return rowToConnection(data as PlatformConnectionRow);
    }

    async save(connection: PlatformConnection): Promise<void> {
        const { error } = await supabaseAdmin
            .from(this.TABLE)
            .upsert(
                {
                    chatteia_user_id: connection.chatteiaUserId,
                    platform: connection.platform,
                    platform_username: connection.platformUsername,
                    platform_user_id: connection.platformUserId,
                    connected_at: connection.connectedAt.toISOString(),
                },
                {
                    onConflict: "chatteia_user_id,platform",
                }
            );

        if (error) {
            console.error("[PlatformConnections] save error:", error);
            throw new Error(`Failed to save platform connection: ${error.message}`);
        }
    }

    async deleteByUserIdAndPlatform(
        chatteiaUserId: string,
        platform: ChatPlatform
    ): Promise<void> {
        const { error } = await supabaseAdmin
            .from(this.TABLE)
            .delete()
            .eq("chatteia_user_id", chatteiaUserId)
            .eq("platform", platform);

        if (error) {
            console.error("[PlatformConnections] deleteByUserIdAndPlatform error:", error);
            throw new Error(`Failed to delete platform connection: ${error.message}`);
        }
    }
}
