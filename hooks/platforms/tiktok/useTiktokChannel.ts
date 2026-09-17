"use client";

import {
    useCallback,
    useEffect,
    useRef,
    useState,
} from "react";

import type {
    ChatConnectionStatus,
    UnifiedChatMessage,
} from "@/lib/chat/types";

const MAX_MESSAGES = 300;

function normalizeChannel(channel: string) {
    return channel
        .trim()
        .replace(/^@/, "")
        .toLowerCase();
}

export function useTikTokChannel(
    channel: string
) {
    const normalizedChannel =
        normalizeChannel(channel);

    const [messages, setMessages] =
        useState<UnifiedChatMessage[]>([]);

    const [status, setStatus] =
        useState<ChatConnectionStatus>("idle");

    const [error, setError] =
        useState<string | null>(null);

    const eventSourceRef =
        useRef<EventSource | null>(null);

    const reconnectTimerRef =
        useRef<ReturnType<typeof setTimeout> | null>(
            null
        );

    const stoppedRef =
        useRef(false);

    const connect = useCallback(() => {
        if (!normalizedChannel) {
            setStatus("error");
            setError("Canal inválido.");
            return;
        }

        if (stoppedRef.current) {
            return;
        }

        eventSourceRef.current?.close();

        setStatus("connecting");
        setError(null);

        const source = new EventSource(
            `/api/platforms/tiktok/stream?channel=${encodeURIComponent(
                normalizedChannel
            )}`
        );

        eventSourceRef.current = source;

        source.addEventListener(
            "ready",
            () => {
                if (stoppedRef.current) {
                    return;
                }

                setStatus("connected");
                setError(null);
            }
        );

        source.onmessage = (event) => {
            if (stoppedRef.current) {
                return;
            }

            try {
                const message =
                    JSON.parse(
                        event.data
                    ) as UnifiedChatMessage;

                setMessages(
                    (current) => {
                        const next = [
                            ...current,
                            message,
                        ];

                        if (
                            next.length >
                            MAX_MESSAGES
                        ) {
                            return next.slice(
                                next.length -
                                MAX_MESSAGES
                            );
                        }

                        return next;
                    }
                );

                setStatus("connected");
                setError(null);
            } catch {
                setError(
                    "Mensagem inválida recebida do TikTok."
                );
            }
        };

        source.onerror = () => {
            if (stoppedRef.current) {
                return;
            }

            source.close();

            setStatus("reconnecting");

            if (
                reconnectTimerRef.current
            ) {
                clearTimeout(
                    reconnectTimerRef.current
                );
            }

            reconnectTimerRef.current =
                setTimeout(() => {
                    reconnectTimerRef.current =
                        null;

                    if (
                        !stoppedRef.current
                    ) {
                        connect();
                    }
                }, 3000);
        };
    }, [normalizedChannel]);

    useEffect(() => {
        stoppedRef.current = false;

        setMessages([]);
        setStatus("idle");
        setError(null);

        connect();

        return () => {
            stoppedRef.current = true;

            eventSourceRef.current?.close();
            eventSourceRef.current = null;

            if (
                reconnectTimerRef.current
            ) {
                clearTimeout(
                    reconnectTimerRef.current
                );

                reconnectTimerRef.current =
                    null;
            }
        };
    }, [connect]);

    const clearMessages =
        useCallback(() => {
            setMessages([]);
        }, []);

    return {
        channel: normalizedChannel,
        messages,
        status,
        error,
        clearMessages,
    };
}