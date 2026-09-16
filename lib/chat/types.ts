export type ChatPlatform =
    | "twitch"
    | "kick"
    | "tiktok"
    | "youtube";

export type ChatConnectionStatus =
    | "idle"
    | "connecting"
    | "connected"
    | "reconnecting"
    | "error"
    | "closed";

export type ChatBadge = {
    id: string;
    imageUrl: string;
    name?: string;
    description?: string;
};

export type ChatEmoteProvider =
    | "twitch"
    | "7tv"
    | "bttv"
    | "ffz"
    | "kick"
    | "tiktok"
    | "youtube";

export type ChatEmote = {
    id: string;
    name: string;
    imageUrl: string;
    start: number;
    end: number;
    provider: ChatEmoteProvider;
};

export type UnifiedChatMessage = {
    id: string;

    platform: ChatPlatform;

    channel: string;
    channelId: string | null;

    username: string;
    displayName: string;

    color: string;

    message: string;

    badges: ChatBadge[];
    emotes: ChatEmote[];

    isAction: boolean;

    timestamp: number;
};

export type ChatConnection = {
    id: string;

    platform: ChatPlatform;

    channel: string;
    channelId: string | null;

    status: ChatConnectionStatus;
    statusDetail?: string;
};