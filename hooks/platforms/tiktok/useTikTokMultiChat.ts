"use client";

import {
    useEffect,
    useMemo,
    useRef,
    useState,
} from "react";

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

type TikTokWorkerChatEvent = {
    uniqueId: string;
    nickname: string;
    userId?: string;
    comment: string;
    profilePictureUrl?: string;
    followRole?: number;
    isModerator?: boolean;
    isSubscriber?: boolean;
};

type TikTokWorkerPayload = {
    type?: string;
    channel?: string;
    event?: TikTokWorkerChatEvent;
    error?: string;
};

const MAX_MESSAGES = 300;
const RECONNECT_BASE_DELAY = 1000;
const RECONNECT_MAX_DELAY = 15000;

function normalizeChannels(channels: string[]) {
    return Array.from(
        new Set(
            channels
                .map((channel) =>
                    channel
                        .trim()
                        .replace(/^@/, "")
                        .toLowerCase()
                )
                .filter((channel) =>
                    /^[a-zA-Z0-9_.]{2,50}$/.test(channel)
                )
        )
    );
}

function createUnifiedMessage(
    channel: string,
    event: TikTokWorkerChatEvent
): UnifiedChatMessage {
    const isModerator = Boolean(event.isModerator);
    const isSubscriber = Boolean(event.isSubscriber);

    const badges = [];

    if (isModerator) {
        badges.push({
            id: "moderator",
            imageUrl: "",
            name: "Moderador",
        });
    }

    if (isSubscriber) {
        badges.push({
            id: "subscriber",
            imageUrl: "",
            name: "Assinante",
        });
    }

    return {
        id: `${event.userId ?? event.uniqueId}-${Date.now()}-${Math.random()
    .toString(36)
    .slice(2)}`,
        platform: "tiktok",
        channel,
        channelId: null,
        username: event.uniqueId,
        displayName: event.nickname || event.uniqueId,
        color: isModerator
            ? "#25F4EE"
            : isSubscriber
                ? "#FE2C55"
                : "#FFFFFF",
        message: event.comment,
        badges,
        emotes: [],
        isAction: false,
        timestamp: Date.now(),
    };
}

export function useTikTokMultiChat(
    channels: string[]
): Result {
    const channelKey = channels
        .map((channel) =>
            channel
                .trim()
                .replace(/^@/, "")
                .toLowerCase()
        )
        .filter(Boolean)
        .join("|");

    const normalizedChannels = useMemo(
        () => normalizeChannels(channels),
        [channelKey]
    );

    const normalizedChannelKey =
        normalizedChannels.join("|");

    const sourcesRef = useRef<
        Record<string, EventSource>
    >({});

    const timersRef = useRef<
        Record<
            string,
            ReturnType<typeof setTimeout>
        >
    >({});

    const attemptsRef = useRef<
        Record<string, number>
    >({});

    const [connections, setConnections] =
        useState<Record<string, Connection>>({});

    useEffect(() => {
        let disposed = false;

        const active = new Set(normalizedChannels);

        const workerUrl =
            process.env.NEXT_PUBLIC_TIKTOK_WORKER_URL;

        if (!workerUrl) {
            setConnections((current) => {
                const next = {
                    ...current,
                };

                for (const channel of normalizedChannels) {
                    next[channel] = {
                        channel,
                        messages:
                            current[channel]?.messages ?? [],
                        status: "error",
                        statusDetail:
                            "Worker do TikTok não configurado.",
                    };
                }

                return next;
            });

            return () => {
                disposed = true;
            };
        }

        const configuredWorkerUrl =
            workerUrl.replace(/\/$/, "");

        function clearReconnectTimer(
            channel: string
        ) {
            const timer =
                timersRef.current[channel];

            if (!timer) {
                return;
            }

            clearTimeout(timer);

            delete timersRef.current[channel];
        }

        function closeChannel(
            channel: string
        ) {
            clearReconnectTimer(channel);

            const source =
                sourcesRef.current[channel];

            if (source) {
                source.close();

                delete sourcesRef.current[
                    channel
                ];
            }

            delete attemptsRef.current[channel];
        }

        function isCurrentSource(
            channel: string,
            source: EventSource
        ) {
            return (
                !disposed &&
                sourcesRef.current[channel] ===
                    source &&
                active.has(channel)
            );
        }

        function scheduleReconnect(
            channel: string,
            connect: () => void
        ) {
            if (
                disposed ||
                !active.has(channel)
            ) {
                return;
            }

            if (timersRef.current[channel]) {
                return;
            }

            const attempt =
                (attemptsRef.current[channel] ??
                    0) + 1;

            attemptsRef.current[channel] =
                attempt;

            const delay = Math.min(
                RECONNECT_BASE_DELAY *
                    2 ** (attempt - 1),
                RECONNECT_MAX_DELAY
            );

            setConnections((current) => ({
                ...current,
                [channel]: {
                    ...(current[channel] ?? {
                        channel,
                        messages: [],
                    }),
                    status: "reconnecting",
                    statusDetail:
                        "Reconectando…",
                },
            }));

            timersRef.current[channel] =
                setTimeout(() => {
                    delete timersRef.current[
                        channel
                    ];

                    if (
                        disposed ||
                        !active.has(channel)
                    ) {
                        return;
                    }

                    connect();
                }, delay);
        }

        function connectChannel(
            channel: string
        ) {
            if (
                disposed ||
                !active.has(channel)
            ) {
                return;
            }

            if (sourcesRef.current[channel]) {
                return;
            }

            if (timersRef.current[channel]) {
                return;
            }

            const streamUrl =
                `${configuredWorkerUrl}/stream?channel=${encodeURIComponent(
channel
)}`;

            const source =
                new EventSource(streamUrl);

            sourcesRef.current[channel] =
                source;

            source.addEventListener(
                "ready",
                () => {
                    if (
                        !isCurrentSource(
                            channel,
                            source
                        )
                    ) {
                        return;
                    }

                    clearReconnectTimer(
                        channel
                    );

                    attemptsRef.current[
                        channel
                    ] = 0;

                    setConnections(
                        (current) => ({
                            ...current,
                            [channel]: {
                                ...(current[
                                    channel
                                ] ?? {
                                    channel,
                                    messages: [],
                                }),
                                status:
                                    "connected",
                                statusDetail:
                                    undefined,
                            },
                        })
                    );
                }
            );

            source.onopen = () => {
                if (
                    !isCurrentSource(
                        channel,
                        source
                    )
                ) {
                    return;
                }

                clearReconnectTimer(channel);

                attemptsRef.current[
                    channel
                ] = 0;

                setConnections(
                    (current) => ({
                        ...current,
                        [channel]: {
                            ...(current[
                                channel
                            ] ?? {
                                channel,
                                messages: [],
                            }),
                            status: "connected",
                            statusDetail:
                                undefined,
                        },
                    })
                );
            };

            source.onmessage = (
                event
            ) => {
                if (
                    !isCurrentSource(
                        channel,
                        source
                    )
                ) {
                    return;
                }

                try {
                    const payload =
                        JSON.parse(
                            event.data
                        ) as TikTokWorkerPayload;

                    if (
                        payload.type ===
                        "error"
                    ) {
                        setConnections(
                            (current) => ({
                                ...current,
                                [channel]: {
                                    ...(current[
                                        channel
                                    ] ?? {
                                        channel,
                                        messages: [],
                                    }),
                                    status:
                                        "error",
                                    statusDetail:
                                        payload.error ??
                                        "Erro de conexão com o TikTok.",
                                },
                            })
                        );

                        return;
                    }

                    if (
                        payload.type ===
                        "disconnected"
                    ) {
                        if (
                            sourcesRef.current[
                                channel
                            ] === source
                        ) {
                            source.close();

                            delete sourcesRef.current[
                                channel
                            ];
                        }

                        scheduleReconnect(
                            channel,
                            () =>
                                connectChannel(
                                    channel
                                )
                        );

                        return;
                    }

                    if (
                        payload.type !==
                            "chat" ||
                        !payload.event
                    ) {
                        return;
                    }

                    const message =
                        createUnifiedMessage(
                            channel,
                            payload.event
                        );

                    setConnections(
                        (current) => {
                            const existing =
                                current[
                                    channel
                                ];

                            if (!existing) {
                                return current;
                            }

                            if (
                                existing.messages.some(
                                    (
                                        item
                                    ) =>
                                        item.id ===
                                        message.id
                                )
                            ) {
                                return current;
                            }

                            return {
                                ...current,
                                [channel]: {
                                    ...existing,
                                    status:
                                        "connected",
                                    statusDetail:
                                        undefined,
                                    messages:
                                        [
                                            ...existing.messages,
                                            message,
                                        ].slice(
                                            -MAX_MESSAGES
                                        ),
                                },
                            };
                        }
                    );
                } catch (parseError) {
                    console.error(
                        "[TIKTOK MULTI-CHAT] Erro ao processar evento:",
                        parseError
                    );
                }
            };

            source.onerror = () => {
                if (
                    sourcesRef.current[
                        channel
                    ] !== source
                ) {
                    source.close();
                    return;
                }

                source.close();

                delete sourcesRef.current[
                    channel
                ];

                if (
                    disposed ||
                    !active.has(channel)
                ) {
                    return;
                }

                scheduleReconnect(
                    channel,
                    () =>
                        connectChannel(
                            channel
                        )
                );
            };
        }

        for (const channel of Object.keys(
            sourcesRef.current
        )) {
            if (!active.has(channel)) {
                closeChannel(channel);

                setConnections((current) => {
                    const next = {
                        ...current,
                    };

                    delete next[channel];

                    return next;
                });
            }
        }

        for (const channel of normalizedChannels) {
            if (disposed) {
                break;
            }

            if (
                sourcesRef.current[channel]
            ) {
                continue;
            }

            if (
                timersRef.current[channel]
            ) {
                continue;
            }

            setConnections((current) => ({
                ...current,
                [channel]: {
                    channel,
                    messages:
                        current[channel]?.messages ??
                        [],
                    status: "connecting",
                    statusDetail:
                        "Conectando à live do TikTok…",
                },
            }));

            connectChannel(channel);
        }

        return () => {
            disposed = true;

            for (const channel of Object.keys(
                sourcesRef.current
            )) {
                const source =
                    sourcesRef.current[
                        channel
                    ];

                if (source) {
                    source.close();
                }
            }

            for (const timer of Object.values(
                timersRef.current
            )) {
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
                .flatMap(
                    (connection) =>
                        connection.messages
                )
                .sort(
                    (a, b) =>
                        a.timestamp -
                        b.timestamp
                ),
        [connections]
    );

    return {
        messages,
        connections,
    };
}