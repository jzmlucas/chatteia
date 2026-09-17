import type {
    YouTubeChannel,
    YouTubeChatResponse,
    YouTubeLive,
} from "./types";

const API_URL =
    "https://www.googleapis.com/youtube/v3";

const CHANNEL_CACHE_TTL =
    10 * 60 * 1000;

const LIVE_CACHE_TTL =
    60 * 1000;

type CacheEntry<T> = {
    value: T;
    expiresAt: number;
};

const channelCache =
    new Map<
        string,
        CacheEntry<YouTubeChannel | null>
    >();

const liveCache =
    new Map<
        string,
        CacheEntry<YouTubeLive | null>
    >();

function getApiKey() {
    const apiKey =
        process.env.YOUTUBE_API_KEY;

    if (!apiKey) {
        throw new Error(
            "YOUTUBE_API_KEY não configurada."
        );
    }

    return apiKey;
}

async function youtubeFetch<T>(
    path: string,
    params: Record<string, string>
): Promise<T> {
    const searchParams =
        new URLSearchParams({
            ...params,
            key: getApiKey(),
        });

    const response =
        await fetch(
            `${API_URL}${path}?${searchParams.toString()}`,
            {
                method: "GET",
                cache: "no-store",
            }
        );

    const text =
        await response.text();

    let data: any;

    try {
        data =
            JSON.parse(text);
    } catch {
        data = {
            error: {
                message: text,
            },
        };
    }

    if (!response.ok) {
        console.error(
            "[YOUTUBE] API error:",
            {
                status:
                    response.status,
                data,
            }
        );

        throw new Error(
            data?.error?.message ||
                `YouTube API HTTP ${response.status}`
        );
    }

    return data as T;
}

function normalizeHandle(
    channel: string
) {
    let value =
        channel.trim();

    value =
        value.replace(
            /^https?:\/\/(www\.)?youtube\.com\//i,
            ""
        );

    value =
        value.split("?")[0];

    value =
        value.split("/")[0];

    value =
        value.replace(
            /^@/,
            ""
        );

    return value.trim();
}

export async function getYouTubeChannel(
    channel: string
): Promise<YouTubeChannel | null> {
    const handle =
        normalizeHandle(channel);

    if (!handle) {
        return null;
    }

    const cacheKey =
        handle.toLowerCase();

    const cached =
        channelCache.get(
            cacheKey
        );

    if (
        cached &&
        cached.expiresAt >
        Date.now()
    ) {
        return cached.value;
    }

    const isChannelId =
        /^UC[a-zA-Z0-9_-]{20,}$/.test(
            handle
        );

    const data =
        isChannelId
            ? await youtubeFetch<{
                items: Array<{
                    id: string;
                    snippet?: {
                        title?: string;
                    };
                }>;
            }>(
                "/channels",
                {
                    part:
                        "id,snippet",
                    id:
                    handle,
                }
            )
            : await youtubeFetch<{
                items: Array<{
                    id: string;
                    snippet?: {
                        title?: string;
                    };
                }>;
            }>(
                "/channels",
                {
                    part:
                        "id,snippet",
                    forHandle:
                    handle,
                }
            );

    const item =
        data.items?.[0];

    const result =
        item
            ? {
                id:
                item.id,
                title:
                    item.snippet
                        ?.title ??
                    handle,
                handle:
                    isChannelId
                        ? null
                        : handle,
            }
            : null;

    channelCache.set(
        cacheKey,
        {
            value:
            result,
            expiresAt:
                Date.now() +
                CHANNEL_CACHE_TTL,
        }
    );

    return result;
}

export async function getActiveYouTubeLive(
    channelId: string,
    forceRefresh = false
): Promise<YouTubeLive | null> {
    if (!forceRefresh) {
        const cached =
            liveCache.get(
                channelId
            );

        if (
            cached &&
            cached.expiresAt >
                Date.now()
        ) {
            return cached.value;
        }
    }

    const searchData =
        await youtubeFetch<{
            items: Array<{
                id?: {
                    videoId?: string;
                };
                snippet?: {
                    title?: string;
                    channelId?: string;
                    channelTitle?: string;
                };
            }>;
        }>(
            "/search",
            {
                part:
                    "id,snippet",
                channelId,
                eventType:
                    "live",
                type:
                    "video",
                maxResults:
                    "5",
            }
        );

    const videoIds =
        searchData.items
            ?.map(
                (item) =>
                    item.id
                        ?.videoId
            )
            .filter(
                (
                    value
                ): value is string =>
                    Boolean(value)
            );

    if (
        !videoIds ||
        videoIds.length === 0
    ) {
        liveCache.set(
            channelId,
            {
                value:
                    null,
                expiresAt:
                    Date.now() +
                    LIVE_CACHE_TTL,
            }
        );

        return null;
    }

    const videos =
        await youtubeFetch<{
            items: Array<{
                id: string;
                snippet?: {
                    title?: string;
                    channelId?: string;
                    channelTitle?: string;
                };
                liveStreamingDetails?: {
                    activeLiveChatId?: string;
                };
            }>;
        }>(
            "/videos",
            {
                part:
                    "snippet,liveStreamingDetails",
                id:
                    videoIds.join(","),
            }
        );

    const live =
        videos.items.find(
            (video) =>
                Boolean(
                    video
                        .liveStreamingDetails
                        ?.activeLiveChatId
                )
        );

    if (!live) {
        liveCache.set(
            channelId,
            {
                value:
                    null,
                expiresAt:
                    Date.now() +
                    LIVE_CACHE_TTL,
            }
        );

        return null;
    }

    const result: YouTubeLive = {
        videoId:
            live.id,
        title:
            live.snippet?.title ??
            "",
        channelId:
            live.snippet?.channelId ??
            channelId,
        channelTitle:
            live.snippet
                ?.channelTitle ??
            "",
        liveChatId:
            live
                .liveStreamingDetails
                ?.activeLiveChatId ??
            "",
    };

    liveCache.set(
        channelId,
        {
            value:
                result,
            expiresAt:
                Date.now() +
                LIVE_CACHE_TTL,
        }
    );

    return result;
}

export async function getYouTubeChatMessages(
    liveChatId: string,
    pageToken?: string
) {
    const params: Record<
        string,
        string
    > = {
        part:
            "id,snippet,authorDetails",
        liveChatId,
        maxResults:
            "2000",
    };

    if (pageToken) {
        params.pageToken =
            pageToken;
    }

    return youtubeFetch<YouTubeChatResponse>(
        "/liveChat/messages",
        params
    );
}