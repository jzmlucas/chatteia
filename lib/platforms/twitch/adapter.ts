import type {
    ChatBadge,
    ChatEmote,
    UnifiedChatMessage,
} from "@/lib/chat/types";

import type {
    TwitchChatMessage,
} from "@/lib/platforms/twitch/irc";

import type {
    BadgeMap,
} from "@/lib/platforms/twitch/badges";

import type {
    TwitchExternalEmoteMap,
} from "@/lib/platforms/twitch/emotes";

function normalizeTwitchBadges(
    badges: TwitchChatMessage["badges"],
    badgeMap: BadgeMap
): ChatBadge[] {
    if (!badges.length) {
        return [];
    }

    return badges.flatMap((badge) => {
        const info =
            badgeMap[badge.setId]?.[badge.version];

        if (!info) {
            return [];
        }

        return [
            {
                id: `${badge.setId}:${badge.version}`,
                imageUrl: info.image_url_2x,
                name: info.title,
                description: info.description,
            },
        ];
    });
}

function normalizeTwitchEmotes(
    message: TwitchChatMessage,
    externalEmotes: TwitchExternalEmoteMap
): ChatEmote[] {
    const emotes: ChatEmote[] = [];

    for (const emote of message.emotes) {
        emotes.push({
            id: emote.id,
            name: "",
            imageUrl:
                `https://static-cdn.jtvnw.net/emoticons/v2/` +
                `${emote.id}/default/light/2.0`,
            start: emote.start,
            end: emote.end,
            provider: "twitch",
        });
    }

    const occupiedRanges =
        message.emotes.map((emote) => ({
            start: emote.start,
            end: emote.end,
        }));

    const entries = Object.entries(
        externalEmotes
    );

    if (entries.length === 0) {
        return emotes;
    }

    const tokenRegex = /\S+/g;

    let match: RegExpExecArray | null;

    while (
        (match = tokenRegex.exec(
            message.message
        )) !== null
        ) {
        const rawToken = match[0];

        const tokenStart = match.index;

        const tokenEnd =
            tokenStart +
            rawToken.length -
            1;

        let token = rawToken;

        let tokenOffset = 0;

        while (
            token.length > 0 &&
            /^[()[\]{}.,!?;:'"`~]+$/.test(
                token[0]
            )
            ) {
            token = token.slice(1);
            tokenOffset++;
        }

        while (
            token.length > 0 &&
            /^[()[\]{}.,!?;:'"`~]+$/.test(
                token[token.length - 1]
            )
            ) {
            token = token.slice(0, -1);
        }

        if (!token) {
            continue;
        }

        const start =
            tokenStart + tokenOffset;

        const end =
            start +
            token.length -
            1;

        const externalEmote =
            externalEmotes[token];

        if (!externalEmote) {
            continue;
        }

        const overlapsTwitchEmote =
            occupiedRanges.some(
                (range) =>
                    start <= range.end &&
                    end >= range.start
            );

        if (overlapsTwitchEmote) {
            continue;
        }

        emotes.push({
            id: externalEmote.id,
            name: externalEmote.name,
            imageUrl:
            externalEmote.imageUrl,
            start,
            end,
            provider:
            externalEmote.provider,
        });
    }

    return emotes.sort(
        (a, b) => {
            if (a.start !== b.start) {
                return a.start - b.start;
            }

            return a.end - b.end;
        }
    );
}

export function normalizeTwitchMessage(
    message: TwitchChatMessage,
    badgeMap: BadgeMap,
    externalEmotes: TwitchExternalEmoteMap = {}
): UnifiedChatMessage {
    return {
        id: message.id,

        platform: "twitch",

        channel: message.channel,
        channelId: message.channelId,

        username: message.username,
        displayName: message.displayName,

        color: message.color,

        message: message.message,

        badges: normalizeTwitchBadges(
            message.badges,
            badgeMap
        ),

        emotes: normalizeTwitchEmotes(
            message,
            externalEmotes
        ),

        isAction: message.isAction,

        timestamp: message.timestamp,
    };
}