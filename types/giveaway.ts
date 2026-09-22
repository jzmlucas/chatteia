import type { ChatPlatform } from "@/lib/chat/types";

/*
 * Limite de canais participantes por sorteio. Hoje vale pra todo mundo com
 * acesso ao modo streamer; quando o plano for dividido em tiers (ver
 * lib/billing/entitlements.ts), o gate de "sorteio colaborativo" deve virar
 * uma checagem de plano aqui, e este número deve variar por plano.
 */
export const MAX_GIVEAWAY_CHANNELS = 4;

export const GIVEAWAY_TRIGGER_MAX_LENGTH = 32;
export const GIVEAWAY_CHANNEL_NAME_MAX_LENGTH = 64;

export type GiveawayStatus = "draft" | "open" | "closed";

export type GiveawayChannel = {
    platform: ChatPlatform;
    /** Nome do canal na plataforma, como digitado (sem "@", sem URL). */
    channelName: string;
};

export type GiveawayWinner = GiveawayChannel & {
    username: string;
};

/** Linha da tabela `giveaways` (ver postgres/migrations/0003_giveaways.sql). */
export type GiveawayRow = {
    owner_user_id: string;
    trigger: string;
    status: GiveawayStatus;
    channels: GiveawayChannel[];
    winner: GiveawayWinner | null;
    opened_at: Date | null;
    closed_at: Date | null;
    created_at: Date;
    updated_at: Date;
};

/** O que a UI precisa para renderizar a aba de configuração de sorteios. */
export type GiveawaySummary = {
    trigger: string;
    status: GiveawayStatus;
    channels: GiveawayChannel[];
    winner: GiveawayWinner | null;
    openedAt: string | null;
    closedAt: string | null;
    updatedAt: string;
};

export function toGiveawaySummary(row: GiveawayRow): GiveawaySummary {
    return {
        trigger: row.trigger,
        status: row.status,
        channels: row.channels,
        winner: row.winner,
        openedAt: row.opened_at ? row.opened_at.toISOString() : null,
        closedAt: row.closed_at ? row.closed_at.toISOString() : null,
        updatedAt: row.updated_at.toISOString(),
    };
}

export const CHAT_PLATFORMS: ChatPlatform[] = [
    "twitch",
    "kick",
    "youtube",
    "tiktok",
];

export function isChatPlatform(value: unknown): value is ChatPlatform {
    return (
        typeof value === "string" &&
        (CHAT_PLATFORMS as string[]).includes(value)
    );
}
