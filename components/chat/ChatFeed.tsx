"use client";

import {
    useEffect,
    useRef,
    useState,
} from "react";

import {
    useChatAutoScroll,
} from "@/hooks/chat/useChatAutoScroll";

import {
    useChatActivity,
} from "@/hooks/chat/useChatActivity";

import {
    ChatMessage,
    type FeedMessage,
} from "./ChatMessage";

import {
    ChatNewMessagesButton,
} from "./ChatNewMessagesButton";

import type {
    ObsChatSettings,
} from "@/types/chat/obs";

export type { FeedMessage };

type ChatActivity = ReturnType<
    typeof useChatActivity
>;

type ObsAnimatedMessage = {
    id: string;
    message: FeedMessage;
    x: number;
    y: number;
};

const MOVEMENT_SPEEDS = {
    slow: 25,
    normal: 50,
    fast: 90,
} as const;

export function ChatFeed({
                             messages,
                             emptyLabel = "Aguardando mensagens do chat…",
                             showChannelTag = false,
                             variant = "default",
                             obsSettings,
                         }: {
    messages: FeedMessage[];
    emptyLabel?: string;
    showChannelTag?: boolean;
    variant?: "default" | "obs";
    obsSettings?: ObsChatSettings;
}) {
    const activity =
        useChatActivity(
            messages
        );

    if (variant === "obs") {
        return (
            <ObsChatFeed
                messages={messages}
                showChannelTag={
                    showChannelTag
                }
                obsSettings={
                    obsSettings!
                }
                activity={
                    activity
                }
            />
        );
    }

    return (
        <DefaultChatFeed
            messages={messages}
            emptyLabel={emptyLabel}
            showChannelTag={
                showChannelTag
            }
            activity={
                activity
            }
        />
    );
}

function DefaultChatFeed({
                             messages,
                             emptyLabel,
                             showChannelTag,
                             activity,
                         }: {
    messages: FeedMessage[];
    emptyLabel: string;
    showChannelTag: boolean;
    activity: ChatActivity;
}) {
    const {
        scrollRef,
        newMessagesCount,
        handleScroll,
        scrollToBottom,
    } = useChatAutoScroll({
        messageCount:
        messages.length,
    });

    return (
        <div className="relative flex-1 min-h-0">
            <div
                ref={scrollRef}
                onScroll={
                    handleScroll
                }
                className="h-full overflow-y-auto bg-twitch-dark px-3 py-3 space-y-1.5"
            >
                {messages.length === 0 &&
                    emptyLabel && (
                        <p className="text-sm text-zinc-500">
                            {
                                emptyLabel
                            }
                        </p>
                    )}

                {messages.map(
                    (message) => (
                        <ChatMessage
                            key={`${message.platform}-${message.channel}-${message.id}`}
                            message={
                                message
                            }
                            showChannelTag={
                                showChannelTag
                            }
                            activity={
                                activity.getActivity(
                                    message
                                )
                            }
                        />
                    )
                )}
            </div>

            <ChatNewMessagesButton
                count={
                    newMessagesCount
                }
                onClick={
                    scrollToBottom
                }
            />
        </div>
    );
}

function ObsChatFeed({
                         messages,
                         showChannelTag,
                         obsSettings,
                         activity,
                     }: {
    messages: FeedMessage[];
    showChannelTag: boolean;
    obsSettings: ObsChatSettings;
    activity: ChatActivity;
}) {
    const containerRef =
        useRef<HTMLDivElement | null>(
            null
        );

    const animationFrameRef =
        useRef<number | null>(
            null
        );

    const previousMessageIdsRef =
        useRef<Set<string>>(
            new Set()
        );

    const [
        containerSize,
        setContainerSize,
    ] = useState({
        width: 0,
        height: 0,
    });

    const [
        animatedMessages,
        setAnimatedMessages,
    ] = useState<
        ObsAnimatedMessage[]
    >([]);

    useEffect(() => {
        const element =
            containerRef.current;

        if (!element) {
            return;
        }

        const updateSize = () => {
            setContainerSize({
                width:
                element.clientWidth,
                height:
                element.clientHeight,
            });
        };

        updateSize();

        const observer =
            new ResizeObserver(
                updateSize
            );

        observer.observe(element);

        return () => {
            observer.disconnect();
        };
    }, []);

    useEffect(() => {
        if (obsSettings.autoScroll) {
            return;
        }

        const visible =
            messages.slice(
                -Math.max(
                    obsSettings.maxMessages,
                    1
                )
            );

        setAnimatedMessages(
            visible.map(
                (
                    message,
                    index
                ) => ({
                    id:
                        getMessageKey(
                            message
                        ),

                    message,

                    x: 16,

                    y:
                        containerSize.height -
                        60 -
                        (visible.length -
                            1 -
                            index) *
                        (obsSettings.fontSize +
                            obsSettings.messageSpacing +
                            20),
                })
            )
        );

        previousMessageIdsRef.current =
            new Set(
                visible.map(
                    getMessageKey
                )
            );
    }, [
        obsSettings.autoScroll,
        obsSettings.maxMessages,
        obsSettings.fontSize,
        obsSettings.messageSpacing,
        containerSize.height,
        messages,
    ]);

    useEffect(() => {
        if (!obsSettings.autoScroll) {
            return;
        }

        if (
            containerSize.width <= 0 ||
            containerSize.height <= 0
        ) {
            return;
        }

        const currentIds =
            new Set(
                messages.map(
                    getMessageKey
                )
            );

        const previousIds =
            previousMessageIdsRef.current;

        const newMessages =
            messages.filter(
                (message) =>
                    !previousIds.has(
                        getMessageKey(
                            message
                        )
                    )
            );

        previousMessageIdsRef.current =
            currentIds;

        if (
            newMessages.length ===
            0
        ) {
            return;
        }

        setAnimatedMessages(
            (current) => {
                let next = [
                    ...current,
                ];

                for (const message of
                    newMessages) {
                    next.push(
                        createObsMessage(
                            message,
                            obsSettings,
                            containerSize
                        )
                    );
                }

                return next.slice(
                    -Math.max(
                        obsSettings.maxMessages,
                        1
                    )
                );
            }
        );
    }, [
        messages,
        obsSettings.autoScroll,
        obsSettings.animationDirection,
        obsSettings.maxMessages,
        containerSize,
    ]);

    useEffect(() => {
        if (!obsSettings.autoScroll) {
            return;
        }

        if (
            containerSize.width <= 0 ||
            containerSize.height <= 0
        ) {
            return;
        }

        const speed =
            MOVEMENT_SPEEDS[
                obsSettings.animationSpeed
                ];

        let lastTime:
            | number
            | null = null;

        const animate = (
            timestamp: number
        ) => {
            if (lastTime === null) {
                lastTime =
                    timestamp;
            }

            const delta =
                Math.min(
                    timestamp -
                    lastTime,
                    50
                );

            lastTime =
                timestamp;

            const distance =
                (speed * delta) /
                1000;

            setAnimatedMessages(
                (current) => {
                    if (
                        current.length ===
                        0
                    ) {
                        return current;
                    }

                    return current
                        .map(
                            (
                                item
                            ) =>
                                moveObsMessage(
                                    item,
                                    distance,
                                    obsSettings.animationDirection
                                )
                        )
                        .filter(
                            (
                                item
                            ) =>
                                !isObsMessageOutside(
                                    item,
                                    obsSettings.animationDirection,
                                    containerSize
                                )
                        );
                }
            );

            animationFrameRef.current =
                requestAnimationFrame(
                    animate
                );
        };

        animationFrameRef.current =
            requestAnimationFrame(
                animate
            );

        return () => {
            if (
                animationFrameRef.current !==
                null
            ) {
                cancelAnimationFrame(
                    animationFrameRef.current
                );

                animationFrameRef.current =
                    null;
            }
        };
    }, [
        obsSettings.autoScroll,
        obsSettings.animationDirection,
        obsSettings.animationSpeed,
        containerSize,
    ]);

    useEffect(() => {
        if (!obsSettings.autoScroll) {
            return;
        }

        setAnimatedMessages([]);

        previousMessageIdsRef.current =
            new Set();
    }, [
        obsSettings.animationDirection,
        obsSettings.animationSpeed,
    ]);

    return (
        <div
            ref={containerRef}
            className="relative h-full w-full overflow-hidden bg-transparent"
            style={{
                fontFamily:
                obsSettings.fontFamily,

                fontSize:
                    `${obsSettings.fontSize}px`,

                fontWeight:
                obsSettings.fontWeight,

                backgroundColor:
                    "transparent",
            }}
        >
            {animatedMessages.map(
                (item) => (
                    <div
                        key={item.id}
                        className="absolute max-w-[90%] break-words"
                        style={{
                            left:
                            item.x,

                            top:
                            item.y,

                            willChange:
                                "transform",

                            transform:
                                "translate3d(0, 0, 0)",

                            pointerEvents:
                                "none",
                        }}
                    >
                        <ChatMessage
                            message={
                                item.message
                            }
                            showChannelTag={
                                showChannelTag
                            }
                            obsSettings={
                                obsSettings
                            }
                            activity={
                                activity.getActivity(
                                    item.message
                                )
                            }
                        />
                    </div>
                )
            )}
        </div>
    );
}

function getMessageKey(
    message: FeedMessage
): string {
    return [
        message.platform,
        message.channel,
        message.id,
    ].join("-");
}

function createObsMessage(
    message: FeedMessage,
    settings: ObsChatSettings,
    size: {
        width: number;
        height: number;
    }
): ObsAnimatedMessage {
    const id =
        `${getMessageKey(message)}-${createUniqueId()}`;

    switch (
        settings.animationDirection
        ) {
        case "up":
            return {
                id,
                message,
                x: 16,
                y:
                    size.height +
                    40,
            };

        case "down":
            return {
                id,
                message,
                x: 16,
                y: -120,
            };

        case "left":
            return {
                id,
                message,
                x:
                    size.width +
                    40,
                y:
                    getHorizontalLane(
                        size.height,
                        settings
                    ),
            };

        case "right":
            return {
                id,
                message,
                x: -700,
                y:
                    getHorizontalLane(
                        size.height,
                        settings
                    ),
            };
    }
}

function getHorizontalLane(
    height: number,
    settings: ObsChatSettings
): number {
    const availableHeight =
        Math.max(
            height - 80,
            40
        );

    const lanes =
        Math.max(
            Math.floor(
                availableHeight /
                Math.max(
                    settings.fontSize +
                    settings.messageSpacing +
                    20,
                    30
                )
            ),
            1
        );

    const lane =
        Math.floor(
            Math.random() *
            lanes
        );

    return (
        16 +
        lane *
        Math.max(
            settings.fontSize +
            settings.messageSpacing +
            20,
            30
        )
    );
}

function moveObsMessage(
    item: ObsAnimatedMessage,
    distance: number,
    direction: ObsChatSettings["animationDirection"]
): ObsAnimatedMessage {
    switch (direction) {
        case "up":
            return {
                ...item,
                y:
                    item.y -
                    distance,
            };

        case "down":
            return {
                ...item,
                y:
                    item.y +
                    distance,
            };

        case "left":
            return {
                ...item,
                x:
                    item.x -
                    distance,
            };

        case "right":
            return {
                ...item,
                x:
                    item.x +
                    distance,
            };
    }
}

function isObsMessageOutside(
    item: ObsAnimatedMessage,
    direction: ObsChatSettings["animationDirection"],
    size: {
        width: number;
        height: number;
    }
): boolean {
    switch (direction) {
        case "up":
            return item.y < -300;

        case "down":
            return (
                item.y >
                size.height +
                300
            );

        case "left":
            return item.x < -800;

        case "right":
            return (
                item.x >
                size.width +
                800
            );
    }
}

function createUniqueId(): string {
    if (
        typeof crypto !==
        "undefined" &&
        typeof crypto.randomUUID ===
        "function"
    ) {
        return crypto.randomUUID();
    }

    return `${Date.now()}-${Math.random()
        .toString(36)
        .slice(2)}`;
}