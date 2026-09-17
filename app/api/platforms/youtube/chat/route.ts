import { NextRequest } from "next/server";

import {
    getActiveYouTubeLive,
    getYouTubeChannel,
    getYouTubeChatMessages,
} from "@/lib/platforms/youtube/api";

import {
    normalizeYouTubeMessage,
} from "@/lib/platforms/youtube/adapter";

export async function GET(
    request: NextRequest
) {
    const channel =
        request.nextUrl.searchParams.get(
            "channel"
        );

    const liveChatId =
        request.nextUrl.searchParams.get(
            "liveChatId"
        );

    const pageToken =
        request.nextUrl.searchParams.get(
            "pageToken"
        );

    if (!channel) {
        return Response.json(
            {
                ok: false,
                error:
                    "Canal do YouTube não informado.",
            },
            {
                status: 400,
            }
        );
    }

    try {
        const youtubeChannel =
            await getYouTubeChannel(
                channel
            );

        if (!youtubeChannel) {
            return Response.json(
                {
                    ok: false,
                    error:
                        "Canal do YouTube não encontrado.",
                },
                {
                    status: 404,
                }
            );
        }

        let activeLive =
            null;

        let currentLiveChatId =
            liveChatId;

        if (
            currentLiveChatId
        ) {
            activeLive = {
                liveChatId:
                    currentLiveChatId,
            };
        } else {
            activeLive =
                await getActiveYouTubeLive(
                    youtubeChannel.id
                );

            if (!activeLive) {
                return Response.json({
                    ok: true,
                    live: false,
                    channel:
                        youtubeChannel,
                    messages: [],
                    liveChatId:
                        null,
                    nextPageToken:
                        null,
                    pollingIntervalMillis:
                        15000,
                });
            }

            currentLiveChatId =
                activeLive.liveChatId;
        }

        if (
            !currentLiveChatId
        ) {
            return Response.json({
                ok: true,
                live: false,
                channel:
                    youtubeChannel,
                messages: [],
                liveChatId:
                    null,
                nextPageToken:
                    null,
                pollingIntervalMillis:
                    15000,
            });
        }

        try {
            const chat =
                await getYouTubeChatMessages(
                    currentLiveChatId,
                    pageToken ??
                        undefined
                );

            const messages =
                chat.items
                    .map(
                        (
                            message
                        ) =>
                            normalizeYouTubeMessage(
                                message,
                                youtubeChannel.title,
                                youtubeChannel.id
                            )
                    )
                    .filter(
                        (
                            message
                        ): message is NonNullable<
                            typeof message
                        > =>
                            message !==
                            null
                    );

            return Response.json({
                ok: true,
                live: true,
                channel:
                    youtubeChannel,
                stream:
                    activeLive,
                messages,
                liveChatId:
                    currentLiveChatId,
                nextPageToken:
                    chat.nextPageToken ??
                    null,
                pollingIntervalMillis:
                    chat.pollingIntervalMillis ??
                    5000,
            });
        } catch (chatError) {
            const message =
                chatError instanceof Error
                    ? chatError.message
                    : "";

            const chatEnded =
                message.includes(
                    "liveChatEnded"
                ) ||
                message.includes(
                    "liveChatDisabled"
                ) ||
                message.includes(
                    "liveChatNotFound"
                ) ||
                message.includes(
                    "Live chat not found"
                );

            if (
                chatEnded
            ) {
                return Response.json({
                    ok: true,
                    live: false,
                    channel:
                        youtubeChannel,
                    messages: [],
                    liveChatId:
                        null,
                    nextPageToken:
                        null,
                    pollingIntervalMillis:
                        15000,
                });
            }

            throw chatError;
        }
    } catch (error) {
        console.error(
            "[YOUTUBE] Chat:",
            error
        );

        return Response.json(
            {
                ok: false,
                error:
                    error instanceof Error
                        ? error.message
                        : "Erro ao consultar o chat do YouTube.",
            },
            {
                status: 500,
            }
        );
    }
}