"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import type {
    ChatConnectionStatus,
    UnifiedChatMessage,
} from "@/lib/chat/types";

type Connection = {
    channel: string;
    messages: UnifiedChatMessage[];
    status: ChatConnectionStatus;
    statusDetail?: string;
};

type Result = {
    messages: UnifiedChatMessage[];
    connections: Record<string, Connection>;
};

const MAX_MESSAGES = 300;

function normalizeChannels(channels: string[]) {
    return Array.from(
        new Set(
            channels
                .map((channel) => channel.trim().replace(/^@/, "").toLowerCase())
                .filter((channel) => /^[a-zA-Z0-9_.]{2,50}$/.test(channel))
        )
    );
}

export function useTikTokMultiChat(channels: string[]): Result {
    const channelKey = channels
        .map((channel) => channel.trim().replace(/^@/, "").toLowerCase())
        .filter(Boolean)
        .join("|");

    const normalizedChannels = useMemo(
        () => normalizeChannels(channels),
        [channelKey]
    );

    const normalizedChannelKey = normalizedChannels.join("|");

    const sourcesRef = useRef<Record<string, EventSource>>({});
    const timersRef = useRef<Record<string, ReturnType<typeof setTimeout>>>({});
    const attemptsRef = useRef<Record<string, number>>({});

    const [connections, setConnections] = useState<Record<string, Connection>>(
        {}
    );

    useEffect(() => {
        const active = new Set(normalizedChannels);

        // Fecha conexões de canais que saíram da lista.
        for (const channel of Object.keys(sourcesRef.current)) {
            if (!active.has(channel)) {
                sourcesRef.current[channel]?.close();
                delete sourcesRef.current[channel];

                if (timersRef.current[channel]) {
                    clearTimeout(timersRef.current[channel]);
                    delete timersRef.current[channel];
                }

                delete attemptsRef.current[channel];

                setConnections((current) => {
                    const next = { ...current };
                    delete next[channel];
                    return next;
                });
            }
        }

        // Abre conexões para canais novos.
        for (const channel of normalizedChannels) {
            if (sourcesRef.current[channel]) {
                continue;
            }

            setConnections((current) => ({
                ...current,
                [channel]: {
                    channel,
                    messages: current[channel]?.messages ?? [],
                    status: "connecting",
                    statusDetail: "Conectando à live da TikTok…",
                },
            }));

            connectChannel(channel);
        }

        function connectChannel(channel: string) {
            const source = new EventSource(
                `/api/platforms/tiktok/stream?channel=${encodeURIComponent(channel)}`
            );

            sourcesRef.current[channel] = source;

            source.onopen = () => {
                attemptsRef.current[channel] = 0;

                setConnections((current) => ({
                    ...current,
                    [channel]: {
                        ...(current[channel] ?? { channel, messages: [] }),
                        status: "connected",
                        statusDetail: undefined,
                    },
                }));
            };

            source.onmessage = (event) => {
                try {
                    const message = JSON.parse(event.data) as UnifiedChatMessage;

                    setConnections((current) => {
                        const existing = current[channel];

                        if (!existing) return current;

                        if (existing.messages.some((item) => item.id === message.id)) {
                            return current;
                        }

                        return {
                            ...current,
                            [channel]: {
                                ...existing,
                                messages: [...existing.messages, message].slice(
                                    -MAX_MESSAGES
                                ),
                            },
                        };
                    });
                } catch {
                    // Ignore malformed events.
                }
            };

            source.onerror = () => {
                source.close();
                delete sourcesRef.current[channel];

                if (!active.has(channel)) {
                    return;
                }

                const attempt = (attemptsRef.current[channel] ?? 0) + 1;
                attemptsRef.current[channel] = attempt;

                setConnections((current) => ({
                    ...current,
                    [channel]: {
                        ...(current[channel] ?? { channel, messages: [] }),
                        status: "reconnecting",
                        statusDetail: "Reconectando…",
                    },
                }));

                const delay = Math.min(1000 * 2 ** (attempt - 1), 15_000);

                timersRef.current[channel] = setTimeout(() => {
                    if (active.has(channel)) {
                        connectChannel(channel);
                    }
                }, delay);
            };
        }

        return () => {
            for (const channel of Object.keys(sourcesRef.current)) {
                sourcesRef.current[channel]?.close();
            }

            for (const timer of Object.values(timersRef.current)) {
                clearTimeout(timer);
            }

            sourcesRef.current = {};
            timersRef.current = {};
            attemptsRef.current = {};
        };
    }, [normalizedChannelKey]);

    const messages = useMemo(
        () =>
            Object.values(connections)
                .flatMap((connection) => connection.messages)
                .sort((a, b) => a.timestamp - b.timestamp),
        [connections]
    );

    return { messages, connections };
}