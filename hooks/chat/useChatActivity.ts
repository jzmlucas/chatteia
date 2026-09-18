"use client";

import {
    useCallback,
    useEffect,
    useRef,
    useState,
} from "react";

import type {
    UnifiedChatMessage,
} from "@/lib/chat/types";

const MAX_ACTIVITY = 100;

const MIN_VISIBLE_ACTIVITY = 18;

const ACTIVITY_DECAY_PER_SECOND = 1.8;

const ACTIVITY_TICK_MS = 150;

const MESSAGE_COOLDOWN_MS = 1800;

const FAST_MESSAGE_GAIN = 2.5;

const NORMAL_MESSAGE_GAIN = 7;

const GOOD_MESSAGE_GAIN = 10;

const LONG_PAUSE_MESSAGE_GAIN = 13;

const LONG_PAUSE_MS = 6500;

const VERY_LONG_PAUSE_MS = 10000;

const VERY_LONG_PAUSE_GAIN = 15;

export function getChatActivityKey(
    message: Pick<
        UnifiedChatMessage,
        "platform" | "channel" | "username"
    >
): string {
    const username =
        message.username
            .trim()
            .toLowerCase();

    return [
        message.platform,
        message.channel
            .trim()
            .toLowerCase(),
        username,
    ].join(":");
}

function getMessageEventKey(
    message: Pick<
        UnifiedChatMessage,
        "platform" | "channel" | "id"
    >
): string {
    if (
        message.platform ===
        "twitch"
    ) {
        return `twitch:${message.id}`;
    }

    return [
        message.platform,
        message.channel
            .trim()
            .toLowerCase(),
        message.id,
    ].join(":");
}

export function useChatActivity(
    messages: Array<
        Pick<
            UnifiedChatMessage,
            | "id"
            | "platform"
            | "channel"
            | "username"
        >
    >
) {
    const [
        activities,
        setActivities,
    ] = useState<
        Record<string, number>
    >({});

    const processedMessagesRef =
        useRef<Set<string>>(
            new Set()
        );

    const lastMessageTimeRef =
        useRef<
            Record<string, number>
        >({});

    const lastTickRef =
        useRef(Date.now());

    useEffect(() => {
        const currentMessages =
            new Map<
                string,
                string
            >();

        for (const message of messages) {
            const eventKey =
                getMessageEventKey(
                    message
                );

            currentMessages.set(
                eventKey,
                getChatActivityKey(
                    message
                )
            );
        }

        const newMessages: Array<{
            activityKey: string;
            timestamp: number;
        }> = [];

        for (const [
            eventKey,
            activityKey,
        ] of currentMessages) {
            if (
                processedMessagesRef.current.has(
                    eventKey
                )
            ) {
                continue;
            }

            processedMessagesRef.current.add(
                eventKey
            );

            newMessages.push({
                activityKey,
                timestamp: Date.now(),
            });
        }

        if (
            processedMessagesRef.current
                .size > 5000
        ) {
            processedMessagesRef.current =
                new Set(
                    currentMessages.keys()
                );
        }

        if (
            newMessages.length ===
            0
        ) {
            return;
        }

        setActivities(
            (current) => {
                const next = {
                    ...current,
                };

                for (const {
                    activityKey,
                    timestamp,
                } of newMessages) {
                    const previousTime =
                        lastMessageTimeRef
                            .current[
                            activityKey
                        ];

                    let gain =
                        NORMAL_MESSAGE_GAIN;

                    if (
                        previousTime
                    ) {
                        const interval =
                            timestamp -
                            previousTime;

                        if (
                            interval <
                            MESSAGE_COOLDOWN_MS
                        ) {
                            const ratio =
                                Math.max(
                                    0,
                                    interval /
                                        MESSAGE_COOLDOWN_MS
                                );

                            gain =
                                FAST_MESSAGE_GAIN +
                                (
                                    NORMAL_MESSAGE_GAIN -
                                    FAST_MESSAGE_GAIN
                                ) *
                                ratio;
                        } else if (
                            interval >=
                            VERY_LONG_PAUSE_MS
                        ) {
                            gain =
                                VERY_LONG_PAUSE_GAIN;
                        } else if (
                            interval >=
                            LONG_PAUSE_MS
                        ) {
                            gain =
                                LONG_PAUSE_MESSAGE_GAIN;
                        } else {
                            gain =
                                GOOD_MESSAGE_GAIN;
                        }
                    }

                    next[activityKey] =
                        Math.min(
                            MAX_ACTIVITY,
                            (
                                next[
                                    activityKey
                                ] ?? 0
                            ) +
                            gain
                        );

                    lastMessageTimeRef
                        .current[
                        activityKey
                    ] = timestamp;
                }

                return next;
            }
        );
    }, [messages]);

    useEffect(() => {
        lastTickRef.current =
            Date.now();

        const interval =
            window.setInterval(() => {
                const now =
                    Date.now();

                const elapsed =
                    (
                        now -
                        lastTickRef.current
                    ) / 1000;

                lastTickRef.current =
                    now;

                if (
                    elapsed <= 0
                ) {
                    return;
                }

                setActivities(
                    (current) => {
                        let changed =
                            false;

                        const next: Record<
                            string,
                            number
                        > = {};

                        for (const [
                            key,
                            value,
                        ] of Object.entries(
                            current
                        )) {
                            const nextValue =
                                Math.max(
                                    0,
                                    value -
                                        ACTIVITY_DECAY_PER_SECOND *
                                            elapsed
                                );

                            if (
                                Math.abs(
                                    nextValue -
                                        value
                                ) >
                                0.01
                            ) {
                                changed =
                                    true;
                            }

                            if (
                                nextValue >
                                0
                            ) {
                                next[key] =
                                    nextValue;
                            }
                        }

                        return changed
                            ? next
                            : current;
                    }
                );
            }, ACTIVITY_TICK_MS);

        return () => {
            window.clearInterval(
                interval
            );
        };
    }, []);

    const getActivity =
        useCallback(
            (
                message: Pick<
                    UnifiedChatMessage,
                    | "platform"
                    | "channel"
                    | "username"
                >
            ) => {
                const value =
                    activities[
                        getChatActivityKey(
                            message
                        )
                    ] ?? 0;

                if (
                    value <
                    MIN_VISIBLE_ACTIVITY
                ) {
                    return 0;
                }

                return value;
            },
            [activities]
        );

    return {
        getActivity,
    };
}