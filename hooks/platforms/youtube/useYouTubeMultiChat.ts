"use client";

import {
    useMemo,
} from "react";

import type {
    ChatConnectionStatus,
    UnifiedChatMessage,
} from "@/lib/chat/types";

import {
    useYouTubeChannel,
} from "./useYouTubeChannel";

export type YouTubeMultiChatConnection = {
    channel: string;
    messages: UnifiedChatMessage[];
    status: ChatConnectionStatus;
    statusDetail?: string;
};

type YouTubeMultiChatResult = {
    messages: UnifiedChatMessage[];
    connections: Record<
        string,
        YouTubeMultiChatConnection
    >;
};

function normalizeChannel(
    channel: string
) {
    return channel
        .trim()
        .replace(/^@/, "")
        .replace(/^#/, "");
}

function normalizeChannels(
    channels: string[]
) {
    const result: string[] = [];
    const seen = new Set<string>();

    for (
        const value of channels
        ) {
        const channel =
            normalizeChannel(
                value
            );

        if (!channel) {
            continue;
        }

        const key =
            /^UC[a-zA-Z0-9_-]+$/.test(
                channel
            )
                ? channel
                : channel.toLowerCase();

        if (
            seen.has(key)
        ) {
            continue;
        }

        seen.add(key);
        result.push(channel);
    }

    return result;
}

export function useYouTubeMultiChat(
    channels: string[]
): YouTubeMultiChatResult {
    const channelKey =
        channels
            .map(
                normalizeChannel
            )
            .join("|");

    const normalizedChannels =
        useMemo(
            () =>
                normalizeChannels(
                    channels
                ),
            [channelKey]
        );

    const channel1 =
        normalizedChannels[0] ??
        "";

    const channel2 =
        normalizedChannels[1] ??
        "";

    const channel3 =
        normalizedChannels[2] ??
        "";

    const channel4 =
        normalizedChannels[3] ??
        "";

    const connection1 =
        useYouTubeChannel(
            channel1
        );

    const connection2 =
        useYouTubeChannel(
            channel2
        );

    const connection3 =
        useYouTubeChannel(
            channel3
        );

    const connection4 =
        useYouTubeChannel(
            channel4
        );

    const rawConnections =
        [
            {
                channel:
                channel1,
                state:
                connection1,
            },
            {
                channel:
                channel2,
                state:
                connection2,
            },
            {
                channel:
                channel3,
                state:
                connection3,
            },
            {
                channel:
                channel4,
                state:
                connection4,
            },
        ];

    const connections =
        useMemo<
            Record<
                string,
                YouTubeMultiChatConnection
            >
        >(
            () => {
                const result: Record<
                    string,
                    YouTubeMultiChatConnection
                > = {};

                for (
                    const item of
                    rawConnections
                    ) {
                    if (
                        !item.channel
                    ) {
                        continue;
                    }

                    result[
                        item.channel
                        ] = {
                        channel:
                        item.channel,
                        messages:
                        item.state
                            .messages,
                        status:
                        item.state
                            .status,
                        statusDetail:
                        item.state
                            .statusDetail,
                    };
                }

                return result;
            },
            [
                channel1,
                channel2,
                channel3,
                channel4,
                connection1,
                connection2,
                connection3,
                connection4,
            ]
        );

    const messages =
        useMemo(
            () =>
                normalizedChannels
                    .flatMap(
                        (
                            channel
                        ) =>
                            connections[
                                channel
                                ]
                                ?.messages ??
                            []
                    )
                    .sort(
                        (
                            a,
                            b
                        ) =>
                            a.timestamp -
                            b.timestamp
                    ),
            [
                normalizedChannels,
                connections,
            ]
        );

    return {
        messages,
        connections,
    };
}