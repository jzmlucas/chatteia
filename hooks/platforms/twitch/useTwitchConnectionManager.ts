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

import {
    normalizeTwitchMessage,
} from "@/lib/platforms/twitch/adapter";

import {
    TwitchChatClient,
    type TwitchChatMessage,
} from "@/lib/platforms/twitch/irc";

import {
    fetchBadgeMap,
    type BadgeMap,
} from "@/lib/platforms/twitch/badges";

import {
    fetchTwitchExternalEmoteMap,
    type TwitchExternalEmoteMap,
} from "@/lib/platforms/twitch/emotes";

type TwitchConnectionState = {
    channel: string;
    messages: UnifiedChatMessage[];
    status: ChatConnectionStatus;
    statusDetail?: string;
};

type ConnectionRegistry = Record<
    string,
    TwitchConnectionState
>;

const MAX_MESSAGES = 300;

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

function deduplicateMessages(
    messages: UnifiedChatMessage[]
): UnifiedChatMessage[] {
    const seen = new Set<string>();
    const result: UnifiedChatMessage[] = [];

    for (const message of messages) {
        const key =
            message.platform === "twitch"
                ? `twitch:${message.id}`
                : `${message.platform}:${message.channel}:${message.id}`;

        if (seen.has(key)) {
            continue;
        }

        seen.add(key);
        result.push(message);
    }

    return result;
}

export function useTwitchConnectionManager(
    channels: string[]
) {
    const channelKey = channels
        .map((channel) =>
            channel
                .trim()
                .replace(/^#/, "")
                .toLowerCase()
        )
        .filter(Boolean)
        .join("|");

    const normalizedChannels = useMemo(
        () =>
            normalizeChannels(
                channels
            ),
        [channelKey]
    );

    const normalizedChannelKey =
        normalizedChannels.join("|");

    const clientsRef = useRef<
        Record<string, TwitchChatClient>
    >({});

    const clientTokensRef = useRef<
        Record<string, symbol>
    >({});

    const badgeMapsRef = useRef<
        Record<string, BadgeMap>
    >({});

    const externalEmotesRef = useRef<
        Record<string, TwitchExternalEmoteMap>
    >({});

    const rawMessagesRef = useRef<
        Record<string, TwitchChatMessage[]>
    >({});

    const loadingChannelDataRef = useRef<
        Record<string, boolean>
    >({});

    const mountedRef =
        useRef(false);

    const [
        connections,
        setConnections,
    ] = useState<ConnectionRegistry>({});

    useEffect(() => {
        mountedRef.current = true;

        return () => {
            mountedRef.current = false;

            const clients =
                Object.values(
                    clientsRef.current
                );

            clientsRef.current = {};
            clientTokensRef.current = {};

            for (const client of clients) {
                client.disconnect();
            }
        };
    }, []);

    useEffect(() => {
        async function loadChannelData(
            channel: string,
            channelId: string,
            token: symbol
        ) {
            if (
                loadingChannelDataRef.current[
                    channel
                    ]
            ) {
                return;
            }

            loadingChannelDataRef.current[
                channel
                ] = true;

            try {
                const [
                    badgeMap,
                    externalEmotes,
                ] = await Promise.all([
                    fetchBadgeMap(
                        channelId
                    ),
                    fetchTwitchExternalEmoteMap(
                        channelId
                    ),
                ]);

                if (
                    !mountedRef.current ||
                    clientTokensRef.current[
                        channel
                        ] !== token
                ) {
                    return;
                }

                badgeMapsRef.current[
                    channel
                    ] = badgeMap;

                externalEmotesRef.current[
                    channel
                    ] = externalEmotes;

                const rawMessages =
                    rawMessagesRef.current[
                        channel
                        ] ?? [];

                const normalizedMessages =
                    rawMessages
                        .map((message) =>
                            normalizeTwitchMessage(
                                message,
                                badgeMap,
                                externalEmotes
                            )
                        )
                        .slice(-MAX_MESSAGES);

                setConnections(
                    (current) => {
                        const connection =
                            current[channel];

                        if (
                            !connection
                        ) {
                            return current;
                        }

                        return {
                            ...current,
                            [channel]: {
                                ...connection,
                                messages:
                                normalizedMessages,
                            },
                        };
                    }
                );
            } catch (error) {
                if (
                    mountedRef.current &&
                    clientTokensRef.current[
                        channel
                        ] === token
                ) {
                    console.error(
                        `[Twitch] Falha ao carregar dados do canal ${channel}:`,
                        error
                    );
                }
            } finally {
                if (
                    clientTokensRef.current[
                        channel
                        ] === token
                ) {
                    delete loadingChannelDataRef
                        .current[channel];
                }
            }
        }

        const activeChannels =
            new Set(
                normalizedChannels
            );

        for (const channel of Object.keys(
            clientsRef.current
        )) {
            if (
                activeChannels.has(
                    channel
                )
            ) {
                continue;
            }

            const client =
                clientsRef.current[
                    channel
                    ];

            delete clientsRef.current[
                channel
                ];

            delete clientTokensRef.current[
                channel
                ];

            delete badgeMapsRef.current[
                channel
                ];

            delete externalEmotesRef.current[
                channel
                ];

            delete rawMessagesRef.current[
                channel
                ];

            delete loadingChannelDataRef
                .current[channel];

            client.disconnect();

            setConnections(
                (current) => {
                    if (
                        !current[channel]
                    ) {
                        return current;
                    }

                    const next = {
                        ...current,
                    };

                    delete next[channel];

                    return next;
                }
            );
        }

        for (const channel of normalizedChannels) {
            if (
                clientsRef.current[
                    channel
                    ]
            ) {
                continue;
            }

            const token = Symbol(
                `twitch-${channel}`
            );

            clientTokensRef.current[
                channel
                ] = token;

            rawMessagesRef.current[
                channel
                ] ??= [];

            setConnections(
                (current) => ({
                    ...current,
                    [channel]: {
                        channel,
                        messages:
                            current[channel]
                                ?.messages ??
                            [],
                        status:
                            current[channel]
                                ?.status ??
                            "connecting",
                        statusDetail:
                        current[channel]
                            ?.statusDetail,
                    },
                })
            );

            const client =
                new TwitchChatClient(
                    channel,
                    {
                        onMessage: (
                            twitchMessage
                        ) => {
                            if (
                                !mountedRef.current ||
                                clientTokensRef.current[
                                    channel
                                    ] !== token
                            ) {
                                return;
                            }

                            const rawMessages =
                                rawMessagesRef
                                    .current[
                                    channel
                                    ] ?? [];

                            if (
                                rawMessages.some(
                                    (
                                        message
                                    ) =>
                                        message.id ===
                                        twitchMessage.id
                                )
                            ) {
                                return;
                            }

                            const nextRawMessages =
                                [
                                    ...rawMessages,
                                    twitchMessage,
                                ].slice(
                                    -MAX_MESSAGES
                                );

                            rawMessagesRef.current[
                                channel
                                ] =
                                nextRawMessages;

                            const badgeMap =
                                badgeMapsRef.current[
                                    channel
                                    ] ?? {};

                            const externalEmotes =
                                externalEmotesRef
                                    .current[
                                    channel
                                    ] ?? {};

                            const message =
                                normalizeTwitchMessage(
                                    twitchMessage,
                                    badgeMap,
                                    externalEmotes
                                );

                            setConnections(
                                (current) => {
                                    const connection =
                                        current[
                                            channel
                                            ];

                                    if (
                                        !connection
                                    ) {
                                        return current;
                                    }

                                    if (
                                        connection.messages.some(
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
                                            ...connection,
                                            messages:
                                                [
                                                    ...connection.messages,
                                                    message,
                                                ].slice(
                                                    -MAX_MESSAGES
                                                ),
                                        },
                                    };
                                }
                            );

                            if (
                                twitchMessage.channelId
                            ) {
                                void loadChannelData(
                                    channel,
                                    twitchMessage.channelId,
                                    token
                                );
                            }
                        },

                        onStatus: (
                            status,
                            detail
                        ) => {
                            if (
                                !mountedRef.current ||
                                clientTokensRef.current[
                                    channel
                                    ] !== token
                            ) {
                                return;
                            }

                            setConnections(
                                (current) => {
                                    const connection =
                                        current[
                                            channel
                                            ];

                                    if (
                                        !connection
                                    ) {
                                        return current;
                                    }

                                    if (
                                        connection.status ===
                                        status &&
                                        connection.statusDetail ===
                                        detail
                                    ) {
                                        return current;
                                    }

                                    return {
                                        ...current,
                                        [channel]: {
                                            ...connection,
                                            status,
                                            statusDetail:
                                            detail,
                                        },
                                    };
                                }
                            );
                        },
                    }
                );

            clientsRef.current[
                channel
                ] = client;

            client.connect();
        }
    }, [normalizedChannelKey]);

    const visibleConnections =
        useMemo(() => {
            const result: ConnectionRegistry =
                {};

            for (const channel of normalizedChannels) {
                result[channel] =
                    connections[channel] ?? {
                        channel,
                        messages: [],
                        status: "idle",
                    };
            }

            return result;
        }, [
            normalizedChannels,
            connections,
        ]);

    const messages = useMemo(
        () => {
            const combined =
                normalizedChannels.flatMap(
                    (channel) =>
                        visibleConnections[
                            channel
                            ]?.messages ?? []
                );

            return deduplicateMessages(
                combined
            ).sort(
                (a, b) =>
                    a.timestamp -
                    b.timestamp
            );
        },
        [
            normalizedChannels,
            visibleConnections,
        ]
    );

    return {
        connections:
        visibleConnections,
        messages,
    };
}