import { NextRequest, NextResponse } from "next/server";

type ExternalProvider =
    | "7tv"
    | "bttv"
    | "ffz";

type ExternalEmote = {
    id: string;
    name: string;
    imageUrl: string;
    provider: ExternalProvider;
};

type SevenTVEmote = {
    id?: string;
    name?: string;
    data?: {
        id?: string;
        name?: string;
    };
};

type SevenTVResponse = {
    emotes?: SevenTVEmote[];
    emote_set?: {
        id?: string;
        emotes?: SevenTVEmote[];
    };
};

type BttvEmote = {
    id?: string;
    code?: string;
    imageType?: string;
};

type BttvUserResponse = {
    channelEmotes?: BttvEmote[];
    sharedEmotes?: BttvEmote[];
};

type FfzEmote = {
    id?: number;
    name?: string;
    urls?: Record<string, string>;
};

type FfzSet = {
    emoticons?: FfzEmote[];
};

type FfzRoomResponse = {
    room?: {
        set?: number;
    };
    sets?: Record<string, FfzSet>;
};

type FfzGlobalResponse = {
    default_sets?: number[];
    sets?: Record<string, FfzSet>;
};

function normalizeSevenTVEmotes(
    data: SevenTVResponse
): ExternalEmote[] {
    const emotes =
        data.emotes ??
        data.emote_set?.emotes ??
        [];

    return emotes.flatMap((emote) => {
        const id =
            emote.id ??
            emote.data?.id;

        const name =
            emote.name ??
            emote.data?.name;

        if (!id || !name) {
            return [];
        }

        return [
            {
                id,
                name,
                imageUrl:
                    `https://cdn.7tv.app/emote/` +
                    `${id}/3x.webp`,
                provider: "7tv" as const,
            },
        ];
    });
}

function normalizeBttvEmotes(
    emotes: BttvEmote[]
): ExternalEmote[] {
    return emotes.flatMap((emote) => {
        if (!emote.id || !emote.code) {
            return [];
        }

        return [
            {
                id: emote.id,
                name: emote.code,
                imageUrl:
                    `https://cdn.betterttv.net/emote/` +
                    `${emote.id}/2x`,
                provider: "bttv" as const,
            },
        ];
    });
}

function normalizeFfzEmotes(
    sets: Record<string, FfzSet>,
    setIds?: number[]
): ExternalEmote[] {
    const selectedSets =
        setIds && setIds.length > 0
            ? setIds.map(String)
            : Object.keys(sets);

    const result: ExternalEmote[] = [];

    for (const setId of selectedSets) {
        const set = sets[setId];

        if (!set?.emoticons) {
            continue;
        }

        for (const emote of set.emoticons) {
            if (
                !emote.id ||
                !emote.name ||
                !emote.urls
            ) {
                continue;
            }

            const imageUrl =
                emote.urls["2"] ??
                emote.urls["1"];

            if (!imageUrl) {
                continue;
            }

            result.push({
                id: String(emote.id),
                name: emote.name,
                imageUrl: imageUrl.startsWith("//")
                    ? `https:${imageUrl}`
                    : imageUrl,
                provider: "ffz",
            });
        }
    }

    return result;
}

async function fetchJson<T>(
    url: string
): Promise<T | null> {
    try {
        const response = await fetch(url, {
            cache: "no-store",
            headers: {
                Accept: "application/json",
            },
        });

        if (!response.ok) {
            console.error(
                "[TwitchEmotes] Provider HTTP:",
                response.status,
                url
            );

            return null;
        }

        return (await response.json()) as T;
    } catch (error) {
        console.error(
            "[TwitchEmotes] Provider fetch error:",
            url,
            error
        );

        return null;
    }
}

async function fetchSevenTV(
    channelId: string
): Promise<ExternalEmote[]> {
    const [global, user] =
        await Promise.all([
            fetchJson<SevenTVResponse>(
                "https://7tv.io/v3/emote-sets/global"
            ),

            fetchJson<SevenTVResponse>(
                `https://7tv.io/v3/users/twitch/${encodeURIComponent(
                    channelId
                )}`
            ),
        ]);

    const globalEmotes =
        global
            ? normalizeSevenTVEmotes(global)
            : [];

    let channelEmotes =
        user
            ? normalizeSevenTVEmotes(user)
            : [];

    if (
        channelEmotes.length === 0 &&
        user?.emote_set?.id
    ) {
        const set =
            await fetchJson<SevenTVResponse>(
                `https://7tv.io/v3/emote-sets/${encodeURIComponent(
                    user.emote_set.id
                )}`
            );

        if (set) {
            channelEmotes =
                normalizeSevenTVEmotes(set);
        }
    }

    return [
        ...globalEmotes,
        ...channelEmotes,
    ];
}

async function fetchBttv(
    channelId: string
): Promise<ExternalEmote[]> {
    const [global, channel] =
        await Promise.all([
            fetchJson<BttvEmote[]>(
                "https://api.betterttv.net/3/cached/emotes/global"
            ),

            fetchJson<BttvUserResponse>(
                `https://api.betterttv.net/3/cached/users/twitch/${encodeURIComponent(
                    channelId
                )}`
            ),
        ]);

    const globalEmotes =
        global
            ? normalizeBttvEmotes(global)
            : [];

    const channelEmotes = channel
        ? normalizeBttvEmotes([
            ...(channel.channelEmotes ?? []),
            ...(channel.sharedEmotes ?? []),
        ])
        : [];

    return [
        ...globalEmotes,
        ...channelEmotes,
    ];
}

async function fetchFfz(
    channelId: string
): Promise<ExternalEmote[]> {
    const [global, channel] =
        await Promise.all([
            fetchJson<FfzGlobalResponse>(
                "https://api.frankerfacez.com/v1/set/global"
            ),

            fetchJson<FfzRoomResponse>(
                `https://api.frankerfacez.com/v1/room/id/${encodeURIComponent(
                    channelId
                )}`
            ),
        ]);

    const globalEmotes =
        global?.sets
            ? normalizeFfzEmotes(
                global.sets,
                global.default_sets
            )
            : [];

    const channelSetId =
        channel?.room?.set;

    const channelEmotes =
        channel?.sets
            ? normalizeFfzEmotes(
                channel.sets,
                channelSetId
                    ? [channelSetId]
                    : undefined
            )
            : [];

    return [
        ...globalEmotes,
        ...channelEmotes,
    ];
}

export async function GET(
    request: NextRequest
) {
    const channelId =
        request.nextUrl.searchParams.get(
            "channelId"
        );

    if (!channelId) {
        return NextResponse.json(
            {
                error:
                    "channelId é obrigatório.",
            },
            {
                status: 400,
            }
        );
    }

    const [
        sevenTvResult,
        bttvResult,
        ffzResult,
    ] = await Promise.allSettled([
        fetchSevenTV(channelId),
        fetchBttv(channelId),
        fetchFfz(channelId),
    ]);

    const sevenTv =
        sevenTvResult.status === "fulfilled"
            ? sevenTvResult.value
            : [];

    const bttv =
        bttvResult.status === "fulfilled"
            ? bttvResult.value
            : [];

    const ffz =
        ffzResult.status === "fulfilled"
            ? ffzResult.value
            : [];

    const emoteMap =
        new Map<string, ExternalEmote>();

    for (const emote of ffz) {
        emoteMap.set(
            emote.name,
            emote
        );
    }

    for (const emote of bttv) {
        emoteMap.set(
            emote.name,
            emote
        );
    }

    for (const emote of sevenTv) {
        emoteMap.set(
            emote.name,
            emote
        );
    }

    return NextResponse.json({
        providers: {
            "7tv": sevenTv,
            bttv,
            ffz,
        },
        emotes: Array.from(
            emoteMap.values()
        ),
    });
}