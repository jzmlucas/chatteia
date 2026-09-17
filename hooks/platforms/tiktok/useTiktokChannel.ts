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

const MAX_MESSAGES = 300;
const RECONNECT_DELAY = 3000;

export function useTikTokChannel(
    channel: string
) {
    const normalizedChannel = channel
        .trim()
        .replace(/^@/, "")
        .toLowerCase();

    const [messages, setMessages] =
        useState<UnifiedChatMessage[]>([]);

    const [status, setStatus] =
        useState<ChatConnectionStatus>("idle");

    const [error, setError] =
        useState<string | null>(null);

    const eventSourceRef =
        useRef<EventSource | null>(null);

    const reconnectTimerRef =
        useRef<ReturnType<
            typeof setTimeout
        > | null>(null);

    const stoppedRef =
        useRef(false);

    useEffect(() => {
        stoppedRef.current = false;

        if (!normalizedChannel) {
            setStatus("error");
            setError("Canal inválido.");
            return;
        }

        const workerUrl =
            process.env.NEXT_PUBLIC_TIKTOK_WORKER_URL;

        if (!workerUrl) {
            setStatus("error");
            setError(
                "Worker do TikTok não configurado."
            );

            return;
        }

        const connect = () => {
            if (stoppedRef.current) {
                return;
            }

            setStatus("connecting");
            setError(null);

            const url =
                `${workerUrl.replace(
                    /\/$/,
                    ""
                )}/stream?channel=${encodeURIComponent(
                    normalizedChannel
                )}`;

            const source =
                new EventSource(url);

            eventSourceRef.current =
                source;

            source.addEventListener(
                "ready",
                () => {
                    if (
                        stoppedRef.current
                    ) {
                        return;
                    }

                    setStatus("connected");
                    setError(null);
                }
            );

            source.onmessage = (event) => {
                if (
                    stoppedRef.current
                ) {
                    return;
                }

                try {
                    const payload =
                        JSON.parse(
                            event.data
                        );

                    if (
                        payload.type ===
                        "chat"
                    ) {
                        const eventData =
                            payload.event;

                        const message: UnifiedChatMessage =
                            {
                                id: `${eventData.userId || eventData.uniqueId}-${Date.now()}-${Math.random()
                                    .toString(
                                        36
                                    )
                                    .slice(
                                        2
                                    )}`,
                                platform:
                                    "tiktok",
                                channel:
                                normalizedChannel,
                                channelId:
                                    null,
                                username:
                                eventData.uniqueId,
                                displayName:
                                    eventData.nickname ||
                                    eventData.uniqueId,
                                color:
                                    eventData.isModerator
                                        ? "#25F4EE"
                                        : eventData.isSubscriber
                                            ? "#FE2C55"
                                            : "#FFFFFF",
                                message:
                                eventData.comment,
                                badges: [],
                                emotes: [],
                                isAction:
                                    false,
                                timestamp:
                                    Date.now(),
                            };

                        setMessages(
                            (current) => {
                                const next =
                                    [
                                        ...current,
                                        message,
                                    ];

                                if (
                                    next.length >
                                    MAX_MESSAGES
                                ) {
                                    return next.slice(
                                        -MAX_MESSAGES
                                    );
                                }

                                return next;
                            }
                        );
                    }

                    if (
                        payload.type ===
                        "error"
                    ) {
                        setStatus("error");

                        setError(
                            payload.error ||
                            "Erro de conexão."
                        );
                    }

                    if (
                        payload.type ===
                        "disconnected"
                    ) {
                        setStatus(
                            "reconnecting"
                        );
                    }
                } catch (parseError) {
                    console.error(
                        "[TIKTOK] Erro ao processar mensagem:",
                        parseError
                    );
                }
            };

            source.onerror = () => {
                if (
                    stoppedRef.current
                ) {
                    return;
                }

                source.close();

                eventSourceRef.current =
                    null;

                setStatus(
                    "reconnecting"
                );

                if (
                    reconnectTimerRef.current
                ) {
                    clearTimeout(
                        reconnectTimerRef.current
                    );
                }

                reconnectTimerRef.current =
                    setTimeout(() => {
                        connect();
                    }, RECONNECT_DELAY);
            };
        };

        setMessages([]);
        connect();

        return () => {
            stoppedRef.current = true;

            if (
                reconnectTimerRef.current
            ) {
                clearTimeout(
                    reconnectTimerRef.current
                );

                reconnectTimerRef.current =
                    null;
            }

            if (
                eventSourceRef.current
            ) {
                eventSourceRef.current.close();

                eventSourceRef.current =
                    null;
            }
        };
    }, [normalizedChannel]);

    return {
        messages,
        status,
        error,
        channel: normalizedChannel,
    };
}