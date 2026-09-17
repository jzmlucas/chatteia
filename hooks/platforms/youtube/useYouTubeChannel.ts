"use client";

import {
    useEffect,
    useRef,
    useState,
} from "react";

import type {
    ChatConnectionStatus,
    UnifiedChatMessage,
} from "@/lib/chat/types";

type YouTubeChannelState = {
    messages: UnifiedChatMessage[];
    status: ChatConnectionStatus;
    statusDetail?: string;
};

const MAX_MESSAGES =
    300;

const NOT_LIVE_INTERVAL =
    15000;

const ERROR_INTERVAL =
    10000;

export function useYouTubeChannel(
    channel: string
): YouTubeChannelState {
    const [
        messages,
        setMessages,
    ] = useState<
        UnifiedChatMessage[]
    >([]);

    const [
        status,
        setStatus,
    ] =
        useState<ChatConnectionStatus>(
            "idle"
        );

    const [
        statusDetail,
        setStatusDetail,
    ] = useState<string>();

    const pageTokenRef =
        useRef<string | null>(
            null
        );

    const liveChatIdRef =
        useRef<string | null>(
            null
        );

    const timerRef =
        useRef<
            ReturnType<
                typeof setTimeout
            > | null
        >(null);

    const stoppedRef =
        useRef(false);

    useEffect(() => {
        const normalizedChannel =
            channel
                .trim()
                .replace(/^@/, "")
                .replace(/^#/, "");

        if (
            !normalizedChannel
        ) {
            setMessages([]);
            setStatus("idle");
            setStatusDetail(
                undefined
            );

            return;
        }

        stoppedRef.current =
            false;

        pageTokenRef.current =
            null;

        liveChatIdRef.current =
            null;

        setMessages([]);

        setStatus(
            "connecting"
        );

        setStatusDetail(
            "Procurando transmissão ao vivo…"
        );

        const schedule =
            (
                callback: () => void,
                delay: number
            ) => {
                if (
                    stoppedRef.current
                ) {
                    return;
                }

                if (
                    timerRef.current
                ) {
                    clearTimeout(
                        timerRef.current
                    );
                }

                timerRef.current =
                    setTimeout(
                        callback,
                        delay
                    );
            };

        const load =
            async () => {
                if (
                    stoppedRef.current
                ) {
                    return;
                }

                try {
                    const params =
                        new URLSearchParams();

                    params.set(
                        "channel",
                        normalizedChannel
                    );

                    if (
                        liveChatIdRef.current
                    ) {
                        params.set(
                            "liveChatId",
                            liveChatIdRef.current
                        );
                    }

                    if (
                        pageTokenRef.current
                    ) {
                        params.set(
                            "pageToken",
                            pageTokenRef.current
                        );
                    }

                    const response =
                        await fetch(
                            `/api/platforms/youtube/chat?${params.toString()}`,
                            {
                                cache:
                                    "no-store",
                            }
                        );

                    const data =
                        await response.json();

                    if (
                        stoppedRef.current
                    ) {
                        return;
                    }

                    if (
                        !response.ok
                    ) {
                        throw new Error(
                            data.error ??
                                "Erro ao consultar o YouTube."
                        );
                    }

                    if (
                        !data.live ||
                        !data.liveChatId
                    ) {
                        liveChatIdRef.current =
                            null;

                        pageTokenRef.current =
                            null;

                        setMessages([]);

                        setStatus(
                            "connected"
                        );

                        setStatusDetail(
                            "O canal não está ao vivo."
                        );

                        schedule(
                            load,
                            data.pollingIntervalMillis ??
                                NOT_LIVE_INTERVAL
                        );

                        return;
                    }

                    liveChatIdRef.current =
                        data.liveChatId;

                    setStatus(
                        "connected"
                    );

                    setStatusDetail(
                        undefined
                    );

                    const incoming =
                        Array.isArray(
                            data.messages
                        )
                            ? data.messages as UnifiedChatMessage[]
                            : [];

                    if (
                        incoming.length
                    ) {
                        setMessages(
                            (
                                current
                            ) => {
                                const map =
                                    new Map(
                                        current.map(
                                            (
                                                item
                                            ) => [
                                                item.id,
                                                item,
                                            ]
                                        )
                                    );

                                for (
                                    const message of incoming
                                ) {
                                    map.set(
                                        message.id,
                                        message
                                    );
                                }

                                return Array.from(
                                    map.values()
                                )
                                    .sort(
                                        (
                                            a,
                                            b
                                        ) =>
                                            a.timestamp -
                                            b.timestamp
                                    )
                                    .slice(
                                        -MAX_MESSAGES
                                    );
                            }
                        );
                    }

                    pageTokenRef.current =
                        data.nextPageToken ??
                        null;

                    const pollingInterval =
                        Number(
                            data.pollingIntervalMillis ??
                                5000
                        );

                    const interval =
                        Number.isFinite(
                            pollingInterval
                        )
                            ? Math.max(
                                  pollingInterval,
                                  1000
                              )
                            : 5000;

                    schedule(
                        load,
                        interval
                    );
                } catch (error) {
                    if (
                        stoppedRef.current
                    ) {
                        return;
                    }

                    console.error(
                        "[YOUTUBE] Chat:",
                        error
                    );

                    setStatus(
                        "reconnecting"
                    );

                    setStatusDetail(
                        error instanceof Error
                            ? error.message
                            : "Erro de conexão."
                    );

                    schedule(
                        load,
                        ERROR_INTERVAL
                    );
                }
            };

        load();

        return () => {
            stoppedRef.current =
                true;

            if (
                timerRef.current
            ) {
                clearTimeout(
                    timerRef.current
                );

                timerRef.current =
                    null;
            }

            liveChatIdRef.current =
                null;

            pageTokenRef.current =
                null;
        };
    }, [channel]);

    return {
        messages,
        status,
        statusDetail,
    };
}