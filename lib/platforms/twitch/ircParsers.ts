export type TwitchBadgeRef = {
    setId: string;
    version: string;
};

export type TwitchEmoteRef = {
    id: string;
    start: number;
    end: number;
};

export type TwitchChatMessage = {
    id: string;
    sourceId: string | null;
    channel: string;
    channelId: string | null;
    username: string;
    displayName: string;
    color: string;
    message: string;
    badges: TwitchBadgeRef[];
    emotes: TwitchEmoteRef[];
    isAction: boolean;
    timestamp: number;
};

const DEFAULT_COLOR = "#9146FF";

export function parseTags(tagString: string): Record<string, string> {
    const tags: Record<string, string> = {};

    if (!tagString) {
        return tags;
    }

    for (const pair of tagString.split(";")) {
        const separatorIndex = pair.indexOf("=");

        if (separatorIndex === -1) {
            tags[pair] = "";
            continue;
        }

        const key = pair.slice(0, separatorIndex);
        const value = pair.slice(separatorIndex + 1);

        tags[key] = value;
    }

    return tags;
}

export function parseBadges(badgeString: string): TwitchBadgeRef[] {
    if (!badgeString) {
        return [];
    }

    const badges: TwitchBadgeRef[] = [];

    for (const badge of badgeString.split(",")) {
        if (!badge) {
            continue;
        }

        const separatorIndex = badge.indexOf("/");

        if (separatorIndex === -1) {
            continue;
        }

        const setId = badge.slice(0, separatorIndex);
        const version = badge.slice(separatorIndex + 1);

        if (!setId || !version) {
            continue;
        }

        badges.push({ setId, version });
    }

    return badges;
}

export function parseEmotes(emoteString: string): TwitchEmoteRef[] {
    if (!emoteString) {
        return [];
    }

    const emotes: TwitchEmoteRef[] = [];

    for (const group of emoteString.split("/")) {
        if (!group) {
            continue;
        }

        const separatorIndex = group.indexOf(":");

        if (separatorIndex === -1) {
            continue;
        }

        const id = group.slice(0, separatorIndex);
        const positions = group.slice(separatorIndex + 1);

        if (!id || !positions) {
            continue;
        }

        for (const position of positions.split(",")) {
            const [startString, endString] = position.split("-");

            const start = Number(startString);
            const end = Number(endString);

            if (
                !Number.isInteger(start) ||
                !Number.isInteger(end) ||
                start < 0 ||
                end < start
            ) {
                continue;
            }

            emotes.push({ id, start, end });
        }
    }

    return emotes.sort((a, b) => a.start - b.start);
}

export function parseIrcLine(
    line: string,
    channelLower: string
): TwitchChatMessage | null {
    let raw = line;

    let tags: Record<string, string> = {};

    if (raw.startsWith("@")) {
        const spaceIdx = raw.indexOf(" ");

        if (spaceIdx === -1) {
            return null;
        }

        tags = parseTags(raw.slice(1, spaceIdx));

        raw = raw.slice(spaceIdx + 1);
    }

    if (!raw.includes("PRIVMSG")) {
        return null;
    }

    const privmsgIdx = raw.indexOf("PRIVMSG");

    const prefix = raw.slice(0, privmsgIdx).trim();

    const rest = raw.slice(privmsgIdx + "PRIVMSG".length).trim();

    const firstColon = rest.indexOf(":");

    if (firstColon === -1) {
        return null;
    }

    const message = rest.slice(firstColon + 1);

    let isAction = false;
    let cleanMessage = message;

    if (message.startsWith("\u0001ACTION") && message.endsWith("\u0001")) {
        isAction = true;

        cleanMessage = message.slice(8, -1);
    }

    const usernameMatch = prefix.match(/:([^!]+)!/);

    const username = usernameMatch?.[1] || "desconhecido";

    const displayName = tags["display-name"] || username;

    const color = tags["color"]?.length ? tags["color"] : DEFAULT_COLOR;

    const badges = parseBadges(tags["badges"] || "");

    const emotes = parseEmotes(tags["emotes"] || "");

    const sourceId = tags["source-id"] || null;

    return {
        id:
            sourceId ||
            tags["id"] ||
            `${Date.now()}-${Math.random().toString(36).slice(2)}`,
        sourceId,
        channel: channelLower,
        channelId: tags["room-id"] || null,
        username,
        displayName,
        color,
        message: cleanMessage,
        badges,
        emotes,
        isAction,
        timestamp: Date.now(),
    };
}