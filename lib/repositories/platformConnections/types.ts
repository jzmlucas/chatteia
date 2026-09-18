import type { ChatPlatform } from "@/lib/chat/types";

/*
 * ============================================================================
 * TYPES
 * ============================================================================
 *
 * Tipos puros do domínio — sem nenhuma dependência de banco de dados.
 * A camada de negócio só conhece esses tipos.
 */

export type PlatformConnection = {
    /** UUID do usuário no sistema de autenticação (ex: Supabase auth.users) */
    chatteiaUserId: string;

    /** Plataforma conectada */
    platform: ChatPlatform;

    /** Username/canal na plataforma */
    platformUsername: string;

    /** ID do canal/broadcaster na plataforma */
    platformUserId: string;

    /** Quando a conexão foi criada/atualizada */
    connectedAt: Date;
};

export interface PlatformConnectionRepository {

    findByUserId(chatteiaUserId: string): Promise<PlatformConnection[]>;

    findByUserIdAndPlatform(
        chatteiaUserId: string,
        platform: ChatPlatform
    ): Promise<PlatformConnection | null>;

    save(connection: PlatformConnection): Promise<void>;

    deleteByUserIdAndPlatform(
        chatteiaUserId: string,
        platform: ChatPlatform
    ): Promise<void>;
}
