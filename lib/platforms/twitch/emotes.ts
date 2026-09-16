import type {
    ChatEmoteProvider,
} from "@/lib/chat/types";

export type TwitchExternalEmoteProvider =
    | "7tv"
    | "bttv"
    | "ffz";

export type TwitchExternalEmote = {
    id: string;
    name: string;
    imageUrl: string;
    provider: TwitchExternalEmoteProvider;
};

export type TwitchExternalEmoteMap = Record<
    string,
    TwitchExternalEmote
>;

export type TwitchExternalEmoteProviderMaps =
    Record<
        TwitchExternalEmoteProvider,
        TwitchExternalEmoteMap
    >;

export function createTwitchExternalEmoteMap(
    emotes: TwitchExternalEmote[]
): TwitchExternalEmoteMap {
    const map: TwitchExternalEmoteMap = {};

    for (const emote of emotes) {
        if (
            !emote.id ||
            !emote.name ||
            !emote.imageUrl
        ) {
            continue;
        }

        map[emote.name] = emote;
    }

    return map;
}

export function createTwitchExternalEmoteProviderMaps(
    emotes: TwitchExternalEmote[]
): TwitchExternalEmoteProviderMaps {
    const maps: TwitchExternalEmoteProviderMaps = {
        "7tv": {},
        bttv: {},
        ffz: {},
    };

    for (const emote of emotes) {
        if (
            !emote.id ||
            !emote.name ||
            !emote.imageUrl
        ) {
            continue;
        }

        maps[emote.provider][emote.name] =
            emote;
    }

    return maps;
}

export function mergeTwitchExternalEmoteMaps(
    ...maps: TwitchExternalEmoteMap[]
): TwitchExternalEmoteMap {
    const result: TwitchExternalEmoteMap = {};

    for (const map of maps) {
        for (const [name, emote] of Object.entries(
            map
        )) {
            result[name] = emote;
        }
    }

    return result;
}

export async function fetchTwitchExternalEmoteMap(
    channelId: string
): Promise<TwitchExternalEmoteMap> {
    if (!channelId) {
        return {};
    }

    const response = await fetch(
        `/api/platforms/twitch/emotes?channelId=${encodeURIComponent(
            channelId
        )}`,
        {
            cache: "no-store",
        }
    );

    if (!response.ok) {
        const body = await response.text();

        console.error(
            "[TwitchEmotes] Erro HTTP:",
            response.status,
            body
        );

        throw new Error(
            `Twitch emotes API HTTP ${response.status}`
        );
    }

    const data =
        (await response.json()) as {
            emotes?: TwitchExternalEmote[];
        };

    return createTwitchExternalEmoteMap(
        data.emotes ?? []
    );
}

export function getTwitchExternalEmoteProvider(
    provider: TwitchExternalEmoteProvider
): ChatEmoteProvider {
    return provider;
}