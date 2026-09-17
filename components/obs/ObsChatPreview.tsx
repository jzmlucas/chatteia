"use client";

import {
    useCallback,
    useEffect,
    useRef,
    useState,
} from "react";

import type {
    ObsChatSettings,
} from "@/types/chat/obs";

type Props = {
    settings: ObsChatSettings;
};

type PreviewMessage = {
    username: string;
    message: string;
    color: string;
};

type AnimatedMessage = {
    id: string;
    data: PreviewMessage;
    x: number;
    y: number;
};

const PREVIEW_MESSAGES: PreviewMessage[] = [
    {
        username: "turbao8",
        message: "Salve chat! 👋",
        color: "#9147ff",
    },
    {
        username: "Viewer123",
        message: "Essa live está muito boa!",
        color: "#00d084",
    },
    {
        username: "AnaLive",
        message: "kkkkkkkkkkkk",
        color: "#ff6b9d",
    },
    {
        username: "PlayerOne",
        message: "Qual vai ser a próxima partida?",
        color: "#00b8ff",
    },
    {
        username: "turbao8",
        message: "Daqui a pouco eu vejo isso.",
        color: "#9147ff",
    },
    {
        username: "ViewerPro",
        message: "Muito bom!",
        color: "#f5c542",
    },
    {
        username: "Luna",
        message: "Boa live 🔥",
        color: "#e879f9",
    },
    {
        username: "Carlos",
        message: "Cheguei agora!",
        color: "#22d3ee",
    },
];

const MESSAGE_INTERVALS = {
    slow: 2400,
    normal: 1500,
    fast: 850,
} as const;

const MOVEMENT_SPEEDS = {
    slow: 25,
    normal: 50,
    fast: 90,
} as const;

function createUniqueId(): string {
    if (
        typeof crypto !== "undefined" &&
        typeof crypto.randomUUID === "function"
    ) {
        return crypto.randomUUID();
    }

    return `${Date.now()}-${Math.random()
    .toString(36)
    .slice(2)}`;
}

export function ObsChatPreview({
    settings,
}: Props) {
    const containerRef =
        useRef<HTMLDivElement | null>(null);

    const animationFrameRef =
        useRef<number | null>(null);

    const messageTimerRef =
        useRef<ReturnType<typeof setInterval> | null>(
            null
        );

    const initialTimersRef =
        useRef<
            ReturnType<typeof setTimeout>[]
        >([]);

    const messageIndexRef =
        useRef(0);

    const lastFrameTimeRef =
        useRef<number | null>(null);

    const [messages, setMessages] =
        useState<AnimatedMessage[]>([]);

    const [containerSize, setContainerSize] =
        useState({
            width: 0,
            height: 0,
        });

    /*
     * ----------------------------------------------------------------------
     * MEDIR CONTAINER
     * ----------------------------------------------------------------------
     */

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

    /*
     * ----------------------------------------------------------------------
     * LIMPAR TIMERS
     * ----------------------------------------------------------------------
     */

    const clearAllTimers =
        useCallback(() => {
            if (
                messageTimerRef.current !==
                null
            ) {
                clearInterval(
                    messageTimerRef.current
                );

                messageTimerRef.current =
                    null;
            }

            initialTimersRef.current.forEach(
                (timer) => {
                    clearTimeout(timer);
                }
            );

            initialTimersRef.current = [];
        }, []);

    /*
     * ----------------------------------------------------------------------
     * CRIAR MENSAGEM
     * ----------------------------------------------------------------------
     */

    const createMessage =
        useCallback(() => {
            if (
                containerSize.width <= 0 ||
                containerSize.height <= 0
            ) {
                return;
            }

            const source =
                PREVIEW_MESSAGES[
                    messageIndexRef.current %
                        PREVIEW_MESSAGES.length
                ];

            messageIndexRef.current += 1;

            const newMessage =
                createAnimatedMessage(
                    source,
                    settings.animationDirection,
                    containerSize
                );

            setMessages(
                (current) => {
                    const next = [
                        ...current,
                        newMessage,
                    ];

                    return next.slice(
                        -Math.max(
                            settings.maxMessages,
                            1
                        )
                    );
                }
            );
        }, [
            containerSize,
            settings.animationDirection,
            settings.maxMessages,
        ]);

    /*
     * ----------------------------------------------------------------------
     * RESET QUANDO MUDA CONFIGURAÇÃO
     * ----------------------------------------------------------------------
     */

    useEffect(() => {
        clearAllTimers();

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

        lastFrameTimeRef.current =
            null;

        messageIndexRef.current = 0;

        setMessages([]);
    }, [
        settings.autoScroll,
        settings.animationDirection,
        settings.animationSpeed,
        clearAllTimers,
    ]);

    /*
     * ----------------------------------------------------------------------
     * MODO AUTOMÁTICO
     * ----------------------------------------------------------------------
     */

    useEffect(() => {
        if (!settings.autoScroll) {
            return;
        }

        if (
            containerSize.width <= 0 ||
            containerSize.height <= 0
        ) {
            return;
        }

        clearAllTimers();

        /*
         * Primeiras mensagens.
         */
        for (
            let index = 0;
            index < 4;
            index += 1
        ) {
            const timer =
                setTimeout(() => {
                    createMessage();
                }, index * 350);

            initialTimersRef.current.push(
                timer
            );
        }

        /*
         * Novas mensagens.
         */
        const interval =
            MESSAGE_INTERVALS[
                settings.animationSpeed
            ];

        messageTimerRef.current =
            setInterval(() => {
                createMessage();
            }, interval);

        return () => {
            clearAllTimers();
        };
    }, [
        settings.autoScroll,
        settings.animationSpeed,
        containerSize.width,
        containerSize.height,
        createMessage,
        clearAllTimers,
    ]);

    /*
     * ----------------------------------------------------------------------
     * ANIMAÇÃO
     * ----------------------------------------------------------------------
     */

    useEffect(() => {
        if (!settings.autoScroll) {
            return;
        }

        if (
            containerSize.width <= 0 ||
            containerSize.height <= 0
        ) {
            return;
        }

        const animate = (
            timestamp: number
        ) => {
            if (
                lastFrameTimeRef.current ===
                null
            ) {
                lastFrameTimeRef.current =
                    timestamp;
            }

            const delta =
                Math.min(
                    timestamp -
                        lastFrameTimeRef.current,
                    50
                );

            lastFrameTimeRef.current =
                timestamp;

            const speed =
                MOVEMENT_SPEEDS[
                    settings.animationSpeed
                ];

            const distance =
                (speed * delta) /
                1000;

            setMessages(
                (current) => {
                    if (
                        current.length ===
                        0
                    ) {
                        return current;
                    }

                    return current
                        .map(
                            (item) =>
                                moveMessage(
                                    item,
                                    distance,
                                    settings.animationDirection
                                )
                        )
                        .filter(
                            (item) =>
                                !isOutside(
                                    item,
                                    settings.animationDirection,
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

            lastFrameTimeRef.current =
                null;
        };
    }, [
        settings.autoScroll,
        settings.animationDirection,
        settings.animationSpeed,
        containerSize.width,
        containerSize.height,
    ]);

    /*
     * ----------------------------------------------------------------------
     * MODO MANUAL / PARADO
     * ----------------------------------------------------------------------
     */

    useEffect(() => {
        if (settings.autoScroll) {
            return;
        }

        const count =
            Math.min(
                Math.max(
                    settings.maxMessages,
                    1
                ),
                PREVIEW_MESSAGES.length
            );

        const staticMessages =
            PREVIEW_MESSAGES
                .slice(-count)
                .map(
                    (data) => ({
                        id:
                            createUniqueId(),
                        data,
                        x: 16,
                        y: 0,
                    })
                );

        setMessages(
            staticMessages
        );
    }, [
        settings.autoScroll,
        settings.maxMessages,
    ]);

    /*
     * ----------------------------------------------------------------------
     * CLEANUP FINAL
     * ----------------------------------------------------------------------
     */

    useEffect(() => {
        return () => {
            clearAllTimers();

            if (
                animationFrameRef.current !==
                null
            ) {
                cancelAnimationFrame(
                    animationFrameRef.current
                );
            }
        };
    }, [clearAllTimers]);

    /*
     * ----------------------------------------------------------------------
     * RENDER
     * ----------------------------------------------------------------------
     */

    return (
        <div
            ref={containerRef}
            className="relative h-full w-full overflow-hidden bg-transparent"
            style={{
                fontFamily: settings.fontFamily,
                fontSize: `${settings.fontSize}px`,
                fontWeight: settings.fontWeight,
                backgroundColor: "transparent",
            }}
        >
            {settings.autoScroll ? (
                <AnimatedMessages
                    messages={
                        messages
                    }
                    settings={
                        settings
                    }
                />
            ) : (
                <StaticMessages
                    messages={
                        messages
                    }
                    settings={
                        settings
                    }
                />
            )}
        </div>
    );
}

/*
 * ============================================================================
 * ANIMATED
 * ============================================================================
 */

function AnimatedMessages({
    messages,
    settings,
}: {
    messages: AnimatedMessage[];
    settings: ObsChatSettings;
}) {
    return (
        <>
            {messages.map(
                (item) => (
                    <PreviewMessageItem
                        key={item.id}
                        item={item}
                        settings={
                            settings
                        }
                    />
                )
            )}
        </>
    );
}

/*
 * ============================================================================
 * STATIC
 * ============================================================================
 */

function StaticMessages({
    messages,
    settings,
}: {
    messages: AnimatedMessage[];
    settings: ObsChatSettings;
}) {
    return (
        <div
            className="absolute inset-0 flex flex-col justify-end overflow-hidden"
            style={{
                gap:
                    `${settings.messageSpacing}px`,

                padding:
                    "16px",
            }}
        >
            {messages.map(
                (item) => (
                    <div
                        key={item.id}
                        className="w-full break-words"
                    >
                        <MessageBubble
                            data={
                                item.data
                            }
                            settings={
                                settings
                            }
                        />
                    </div>
                )
            )}
        </div>
    );
}

/*
 * ============================================================================
 * MESSAGE ITEM
 * ============================================================================
 */

function PreviewMessageItem({
    item,
    settings,
}: {
    item: AnimatedMessage;
    settings: ObsChatSettings;
}) {
    return (
        <div
            className="absolute max-w-[90%] break-words"
            style={{
                left:
                    item.x,

                top:
                    item.y,

                transform:
                    "translate3d(0, 0, 0)",

                willChange:
                    "left, top",

                pointerEvents:
                    "none",
            }}
        >
            <MessageBubble
                data={
                    item.data
                }
                settings={
                    settings
                }
            />
        </div>
    );
}

/*
 * ============================================================================
 * MESSAGE BUBBLE
 * ============================================================================
 */

function MessageBubble({
    data,
    settings,
}: {
    data: PreviewMessage;
    settings: ObsChatSettings;
}) {
    return (
        <div
            style={{
                padding:
                    settings.messageBackground
                        ? "8px 12px"
                        : "0",

                borderRadius:
                    `${settings.borderRadius}px`,

                backgroundColor:
                    settings.messageBackground
                        ? hexToRgba(
                              settings.messageBackgroundColor,
                              settings.messageBackgroundOpacity
                          )
                        : "transparent",

                color:
                    settings.messageColor,

                fontFamily:
                    settings.fontFamily,

                fontSize:
                    `${settings.fontSize}px`,

                fontWeight:
                    settings.fontWeight,

                lineHeight:
                    1.5,

                whiteSpace:
                    "normal",
            }}
        >
            <div
                className="flex flex-wrap items-start"
                style={{
                    gap:
                        "0.25rem",
                }}
            >
                {settings.showBadges && (
                    <span
                        className="shrink-0"
                        style={{
                            fontSize:
                                `${Math.max(
    10,
    settings.fontSize -
    3
)}px`,
                        }}
                    >
                        ★
                    </span>
                )}

                {settings.showUsername && (
                    <>
                        <span
                            className="shrink-0 font-semibold"
                            style={{
                                color:
                                    settings.usernameColor,
                            }}
                        >
                            {
                                data.username
                            }
                        </span>

                        <span
                            style={{
                                color:
                                    settings.messageColor,
                            }}
                        >
                            :
                        </span>
                    </>
                )}

                <span
                    style={{
                        color:
                            settings.messageColor,
                    }}
                >
                    {
                        data.message
                    }
                </span>
            </div>
        </div>
    );
}

/*
 * ============================================================================
 * CREATE MESSAGE
 * ============================================================================
 */

function createAnimatedMessage(
    data: PreviewMessage,
    direction: ObsChatSettings["animationDirection"],
    size: {
        width: number;
        height: number;
    }
): AnimatedMessage {
    const id =
        createUniqueId();

    switch (direction) {
        case "up":
            return {
                id,
                data,
                x: 16,
                y:
                    size.height +
                    40,
            };

        case "down":
            return {
                id,
                data,
                x: 16,
                y: -120,
            };

        case "left":
            return {
                id,
                data,
                x:
                    size.width +
                    40,
                y: 16,
            };

        case "right":
            return {
                id,
                data,
                x: -600,
                y: 16,
            };
    }
}

/*
 * ============================================================================
 * MOVE
 * ============================================================================
 */

function moveMessage(
    item: AnimatedMessage,
    distance: number,
    direction: ObsChatSettings["animationDirection"]
): AnimatedMessage {
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

/*
 * ============================================================================
 * OUTSIDE
 * ============================================================================
 */

function isOutside(
    item: AnimatedMessage,
    direction: ObsChatSettings["animationDirection"],
    size: {
        width: number;
        height: number;
    }
): boolean {
    switch (direction) {
        case "up":
            return item.y < -250;

        case "down":
            return (
                item.y >
                size.height +
                    250
            );

        case "left":
            return item.x < -700;

        case "right":
            return (
                item.x >
                size.width +
                    700
            );
    }
}

/*
 * ============================================================================
 * HEX → RGBA
 * ============================================================================
 */

function hexToRgba(
    hex: string,
    opacity: number
): string {
    const normalized =
        hex.replace(
            "#",
            ""
        );

    if (
        normalized.length !==
            6 ||
        !/^[0-9A-Fa-f]{6}$/.test(
            normalized
        )
    ) {
        return `rgba(0, 0, 0, ${
    opacity / 100
})`;
    }

    const red =
        parseInt(
            normalized.substring(
                0,
                2
            ),
            16
        );

    const green =
        parseInt(
            normalized.substring(
                2,
                4
            ),
            16
        );

    const blue =
        parseInt(
            normalized.substring(
                4,
                6
            ),
            16
        );

    const alpha =
        Math.max(
            0,
            Math.min(
                100,
                opacity
            )
        ) / 100;

    return `rgba(${red}, ${green}, ${blue}, ${alpha})`;
}