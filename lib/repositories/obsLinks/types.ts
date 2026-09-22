import type { ChatTarget } from "@/lib/chat/targets";

export type ObsMultiChatLinkRow = {
    owner_user_id: string;
    token_hash: string;
    channels: ChatTarget[];
    created_at: Date;
    updated_at: Date;
};

export interface ObsLinkRepository {
    /** Usado pelo overlay dentro do OBS — busca por hash do token, sem dono. */
    findByTokenHash(tokenHash: string): Promise<ObsMultiChatLinkRow | null>;

    /** Substitui o link do streamer (novo token = o antigo para de valer). */
    rotate(
        ownerUserId: string,
        tokenHash: string,
        channels: ChatTarget[]
    ): Promise<ObsMultiChatLinkRow>;

    delete(ownerUserId: string): Promise<void>;
}
