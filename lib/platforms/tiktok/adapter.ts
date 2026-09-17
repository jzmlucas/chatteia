import type { UnifiedChatMessage } from "@/lib/chat/types";

import type { TikTokChatEvent } from "./types";

const MODERATOR_COLOR = "#25F4EE";
const SUBSCRIBER_COLOR = "#FE2C55";
const DEFAULT_COLOR = "#FFFFFF";

export function adaptTikTokMessage(
    channel: string,
    event: TikTokChatEvent
): UnifiedChatMessage {
    const color = event.isModerator
        ? MODERATOR_COLOR
        : event.isSubscriber
            ? SUBSCRIBER_COLOR
            : DEFAULT_COLOR;

    const badges = [];

    if (event.isModerator) {
        badges.push({
            id: "moderator",
            imageUrl: "",
            name: "Moderador",
        });
    }

    if (event.isSubscriber) {
        badges.push({
            id: "subscriber",
            imageUrl: "",
            name: "Assinante",
        });
    }

    return {
        id: `${event.userId ?? event.uniqueId}-${Date.now()}-${Math.random()
            .toString(36)
            .slice(2)}`,
        platform: "tiktok",
        channel,
        channelId: null,
        username: event.uniqueId,
        displayName: event.nickname || event.uniqueId,
        color,
        message: event.comment,
        badges,
        emotes: [],
        isAction: false,
        timestamp: Date.now(),
    };
}