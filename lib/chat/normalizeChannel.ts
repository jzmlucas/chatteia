export type Platform = "twitch" | "kick" | "youtube" | "tiktok";

export function normalizeTwitchChannel(input: string): string | null {
    const trimmed = input.trim();

    if (trimmed.startsWith("@")) {
        return null;
    }

    const match = trimmed.match(
        /^(?:https?:\/\/)?(?:www\.)?twitch\.tv\/([a-zA-Z0-9_]+)(?:[/?#].*)?$/i
    );

    const candidate = match?.[1] ?? trimmed.replace(/^#/, "");

    if (!/^[a-zA-Z0-9_]{3,25}$/.test(candidate)) {
        return null;
    }

    return candidate.toLowerCase();
}

export function normalizeKickChannel(input: string): string | null {
    const trimmed = input.trim();

    if (trimmed.startsWith("@")) {
        return null;
    }

    const match = trimmed.match(
        /^(?:https?:\/\/)?(?:www\.)?kick\.com\/([a-zA-Z0-9_]+)(?:[/?#].*)?$/i
    );

    const candidate = match?.[1] ?? trimmed.replace(/^#/, "");

    if (!/^[a-zA-Z0-9_]{3,25}$/.test(candidate)) {
        return null;
    }

    return candidate.toLowerCase();
}

export function normalizeYouTubeChannel(input: string): string | null {
    const trimmed = input.trim();

    if (!trimmed) {
        return null;
    }

    const urlPattern = /^(?:https?:\/\/)?(?:www\.)?youtube\.com\/(.+)$/i;

    const match = trimmed.match(urlPattern);

    if (match) {
        const path = match[1]
            .split("?")[0]
            .split("#")[0]
            .replace(/\/+$/, "");

        const parts = path.split("/").filter(Boolean);

        if (parts.length === 2 && parts[0].toLowerCase() === "channel") {
            const channelId = parts[1];

            if (/^UC[a-zA-Z0-9_-]+$/.test(channelId)) {
                return channelId;
            }

            return null;
        }

        if (parts.length === 1 && parts[0].startsWith("@")) {
            const handle = parts[0].slice(1).trim();

            if (!/^[a-zA-Z0-9_.-]{3,100}$/.test(handle)) {
                return null;
            }

            return handle.toLowerCase();
        }

        if (
            parts.length === 2 &&
            (parts[0].toLowerCase() === "user" ||
                parts[0].toLowerCase() === "c")
        ) {
            const channel = parts[1].trim();

            if (!/^[a-zA-Z0-9_-]{3,100}$/.test(channel)) {
                return null;
            }

            return channel.toLowerCase();
        }

        return null;
    }

    if (trimmed.startsWith("@")) {
        const handle = trimmed.slice(1).trim();

        if (!/^[a-zA-Z0-9_.-]{3,100}$/.test(handle)) {
            return null;
        }

        return handle.toLowerCase();
    }

    const candidate = trimmed.replace(/^#/, "");

    if (/^UC[a-zA-Z0-9_-]+$/.test(candidate)) {
        return candidate;
    }

    if (!/^[a-zA-Z0-9_.-]{3,100}$/.test(candidate)) {
        return null;
    }

    return candidate.toLowerCase();
}

export function normalizeTikTokChannel(input: string): string | null {
    const trimmed = input.trim();

    if (!trimmed) {
        return null;
    }

    const match = trimmed.match(
        /^(?:https?:\/\/)?(?:www\.)?tiktok\.com\/@([a-zA-Z0-9_.]+)(?:[/?#].*)?$/i
    );

    const candidate = match?.[1] ?? trimmed.replace(/^@/, "");

    if (!/^[a-zA-Z0-9_.]{2,50}$/.test(candidate)) {
        return null;
    }

    return candidate.toLowerCase();
}

export function normalizeChannel(
    platform: Platform,
    input: string
): string | null {
    if (platform === "twitch") {
        return normalizeTwitchChannel(input);
    }

    if (platform === "kick") {
        return normalizeKickChannel(input);
    }

    if (platform === "tiktok") {
        return normalizeTikTokChannel(input);
    }

    return normalizeYouTubeChannel(input);
}