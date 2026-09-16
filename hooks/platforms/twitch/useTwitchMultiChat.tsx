"use client";

import { useMemo } from "react";

import type {
    UnifiedChatMessage,
} from "@/lib/chat/types";

import {
    useTwitchConnectionManager,
} from "./useTwitchConnectionManager";

export type TwitchMultiChatConnection = {
    channel: string;
    messages: UnifiedChatMessage[];
    status: ReturnType<
        typeof useTwitchConnectionManager
    >["connections"][string]["status"];
    statusDetail?: string;
};

type TwitchMultiChatResult = {
    messages: UnifiedChatMessage[];
    connections: Record<
        string,
        TwitchMultiChatConnection
    >;
};

function normalizeChannels(
    channels: string[]
) {
    return Array.from(
        new Set(
            channels
                .map((channel) =>
                    channel
                        .trim()
                        .replace(/^#/, "")
                        .toLowerCase()
                )
                .filter(Boolean)
        )
    );
}

export function useTwitchMultiChat(
    channels: string[]
): TwitchMultiChatResult {
    const channelKey = channels.join("|");

    const normalizedChannels = useMemo(
        () => normalizeChannels(channels),
        [channelKey]
    );

    const {
        connections,
    } = useTwitchConnectionManager(
        normalizedChannels
    );

    const messages = useMemo(
        () =>
            normalizedChannels
                .flatMap(
                    (channel) =>
                        connections[channel]
                            ?.messages ?? []
                )
                .sort(
                    (a, b) =>
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