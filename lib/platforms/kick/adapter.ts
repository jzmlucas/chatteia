import type { UnifiedChatMessage } from "@/lib/chat/types";
import type { KickChatMessage } from "./types";

function getKickEmoteUrl(emoteId: string) {
    return `https://files.kick.com/emotes/${encodeURIComponent(
    emoteId
)}/fullsize`;
}

export function normalizeKickMessage(
    message: KickChatMessage
): UnifiedChatMessage {
    const createdAt = message.created_at
        ? Date.parse(message.created_at)
        : Date.now();

    const timestamp = Number.isFinite(createdAt)
        ? createdAt
        : Date.now();

    const badges: UnifiedChatMessage["badges"] = [];

    const emotes =
        message.emotes?.flatMap((emote) =>
            emote.positions.map((position) => {
                const emoteText =
                    message.content.slice(
                        position.s,
                        position.e + 1
                    );

                const match =
                    emoteText.match(
                        /^\[emote:\d+:(.+)\]$/
                    );

                const emoteName =
                    match?.[1] ??
                    emote.name ??
                    emote.emote_id;

                return {
                    id: emote.emote_id,

                    name: emoteName,

                    imageUrl:
                        getKickEmoteUrl(
                            emote.emote_id
                        ),

                    start: position.s,

                    end: position.e,

                    provider: "kick" as const,
                };
            })
        ) ?? [];

    return {
        id: message.message_id,

        platform: "kick",

        channel:
            message.broadcaster.channel_slug ??
            message.broadcaster.username,

        channelId:
            String(
                message.broadcaster.user_id
            ),

        username:
        message.sender.username,

        displayName:
        message.sender.username,

        color:
            message.sender.identity
                ?.username_color ??
            "#53FC18",

        message:
        message.content,

        badges,

        emotes,

        isAction: false,

        timestamp,
    };
}