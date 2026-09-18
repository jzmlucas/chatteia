"use client";

import type {
    UnifiedChatMessage,
} from "@/lib/chat/types";

import {
    ChatMessageContent,
} from "./ChatMessageContent";

import type {
    ObsChatSettings,
} from "@/types/chat/obs";

export type FeedMessage =
    UnifiedChatMessage & {
    channelLabel?: string;
    channelColor?: string;
};

export function ChatMessage({
                                message,
                                showChannelTag,
                                obsSettings,
                                activity = 0,
                            }: {
    message: FeedMessage;
    showChannelTag: boolean;
    obsSettings?: ObsChatSettings;
    activity?: number;
}) {
    const isObs = !!obsSettings;

    const usernameColor =
        isObs
            ? obsSettings.usernameColor
            : message.color;

    const messageColor =
        isObs
            ? obsSettings.messageColor
            : undefined;

    const backgroundColor =
        isObs &&
        obsSettings.messageBackground
            ? hexToRgba(
                obsSettings.messageBackgroundColor,
                obsSettings.messageBackgroundOpacity
            )
            : undefined;

    const animationClass =
        isObs
            ? getAnimationClass(
                obsSettings.animationDirection,
                obsSettings.animationSpeed
            )
            : "";

    const activityStyle =
        getActivityStyle(
            usernameColor,
            activity
        );

    return (
        <>
            <style>{`
                @keyframes chat-fire-left {
                    0% {
                        transform: translate3d(0, 3px, 0) rotate(-8deg) scaleY(0.85);
                    }

                    25% {
                        transform: translate3d(-2px, -2px, 0) rotate(-13deg) scaleY(1.05);
                    }

                    50% {
                        transform: translate3d(1px, -5px, 0) rotate(-4deg) scaleY(0.92);
                    }

                    75% {
                        transform: translate3d(-1px, -2px, 0) rotate(-15deg) scaleY(1.08);
                    }

                    100% {
                        transform: translate3d(0, 3px, 0) rotate(-8deg) scaleY(0.85);
                    }
                }

                @keyframes chat-fire-center {
                    0% {
                        transform: translate3d(0, 4px, 0) scaleY(0.82);
                    }

                    20% {
                        transform: translate3d(1px, -3px, 0) scaleY(1.08);
                    }

                    45% {
                        transform: translate3d(-1px, -7px, 0) scaleY(0.92);
                    }

                    70% {
                        transform: translate3d(2px, -3px, 0) scaleY(1.12);
                    }

                    100% {
                        transform: translate3d(0, 4px, 0) scaleY(0.82);
                    }
                }

                @keyframes chat-fire-right {
                    0% {
                        transform: translate3d(0, 3px, 0) rotate(8deg) scaleY(0.84);
                    }

                    30% {
                        transform: translate3d(2px, -4px, 0) rotate(14deg) scaleY(1.08);
                    }

                    55% {
                        transform: translate3d(-1px, -2px, 0) rotate(5deg) scaleY(0.94);
                    }

                    80% {
                        transform: translate3d(2px, -6px, 0) rotate(16deg) scaleY(1.1);
                    }

                    100% {
                        transform: translate3d(0, 3px, 0) rotate(8deg) scaleY(0.84);
                    }
                }

                @keyframes chat-fire-flicker {
                    0% {
                        opacity: 0.75;
                    }

                    25% {
                        opacity: 1;
                    }

                    50% {
                        opacity: 0.82;
                    }

                    75% {
                        opacity: 0.96;
                    }

                    100% {
                        opacity: 0.75;
                    }
                }

                @keyframes chat-fire-embers {
                    0% {
                        transform: translate3d(0, 8px, 0);
                        opacity: 0;
                    }

                    20% {
                        opacity: 1;
                    }

                    50% {
                        transform: translate3d(-2px, -10px, 0);
                        opacity: 0.9;
                    }

                    75% {
                        transform: translate3d(3px, -22px, 0);
                        opacity: 0.65;
                    }

                    100% {
                        transform: translate3d(-1px, -34px, 0);
                        opacity: 0;
                    }
                }

                .chat-fire {
                    pointer-events: none;
                    position: absolute;
                    left: 50%;
                    bottom: calc(100% - 4px);
                    width: 100%;
                    height: 24px;
                    transform: translateX(-50%);
                    overflow: visible;
                    z-index: -1;
                }

                .chat-fire-flame {
                    transform-box: fill-box;
                    transform-origin: bottom center;
                }

                .chat-fire-left {
                    animation:
                        chat-fire-left 0.72s ease-in-out infinite,
                        chat-fire-flicker 0.55s ease-in-out infinite;
                }

                .chat-fire-center {
                    animation:
                        chat-fire-center 0.58s ease-in-out infinite,
                        chat-fire-flicker 0.48s ease-in-out infinite;
                }

                .chat-fire-right {
                    animation:
                        chat-fire-right 0.82s ease-in-out infinite,
                        chat-fire-flicker 0.62s ease-in-out infinite;
                }

                .chat-fire-embers {
                    transform-origin: center bottom;
                    animation: chat-fire-embers 1.15s ease-in-out infinite;
                }

                .chat-username {
                    position: relative;
                    display: inline-flex;
                    align-items: center;
                    isolation: isolate;
                }
            `}</style>

            <div
                className={[
                    "flex",
                    "flex-wrap",
                    "items-start",
                    "break-words",
                    "leading-relaxed",
                    isObs
                        ? "w-full"
                        : "gap-1 text-sm",
                    animationClass,
                ].join(" ")}
                style={
                    isObs
                        ? {
                            fontFamily:
                            obsSettings.fontFamily,
                            fontSize:
                                `${obsSettings.fontSize}px`,
                            fontWeight:
                            obsSettings.fontWeight,
                            gap: "0.25rem",
                            padding:
                                obsSettings.messageBackground
                                    ? "8px 12px"
                                    : "0",
                            borderRadius:
                                "0",
                            backgroundColor:
                            backgroundColor,
                            marginBottom:
                                "0",
                        }
                        : undefined
                }
            >
                {showChannelTag && (
                    <span
                        className="shrink-0 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide"
                        style={{
                            backgroundColor:
                                `${message.channelColor ?? "#F55376"}22`,
                            color:
                                message.channelColor ??
                                "#F55376",
                        }}
                    >
                        {message.channelLabel ??
                            message.channel}
                    </span>
                )}

                {isObs &&
                    obsSettings.showBadges &&
                    message.badges.length > 0 && (
                        <span className="inline-flex shrink-0 items-center gap-1 translate-y-[1px]">
                            {message.badges.map(
                                (badge) => (
                                    <img
                                        key={badge.id}
                                        src={badge.imageUrl}
                                        alt={
                                            badge.name ??
                                            ""
                                        }
                                        title={
                                            badge.description
                                                ? `${badge.name ?? ""} — ${badge.description}`
                                                : badge.name ??
                                                ""
                                        }
                                        loading="lazy"
                                        className="h-[18px] w-[18px] shrink-0 object-contain"
                                    />
                                )
                            )}
                        </span>
                    )}

                {!isObs &&
                    message.badges.length > 0 && (
                        <span className="inline-flex shrink-0 items-center gap-1 translate-y-[1px]">
                            {message.badges.map(
                                (badge) => (
                                    <img
                                        key={badge.id}
                                        src={badge.imageUrl}
                                        alt={
                                            badge.name ??
                                            ""
                                        }
                                        title={
                                            badge.description
                                                ? `${badge.name ?? ""} — ${badge.description}`
                                                : badge.name ??
                                                ""
                                        }
                                        loading="lazy"
                                        className="h-[18px] w-[18px] shrink-0 object-contain"
                                    />
                                )
                            )}
                        </span>
                    )}

                {(!isObs ||
                    obsSettings.showUsername) && (
                    <>
                        <span
                            className="chat-username font-semibold"
                            style={{
                                color:
                                activityStyle.color,
                                textShadow:
                                activityStyle.textShadow,
                                filter:
                                activityStyle.filter,
                            }}
                        >
                            {activity >= 70 && (
                                <>
                                    <span
                                        className="absolute pointer-events-none rounded-full"
                                        style={{
                                            inset:
                                                "-3px -6px",
                                            background:
                                                "radial-gradient(ellipse, rgba(255, 106, 0, 0.45) 0%, rgba(255, 61, 0, 0.2) 42%, transparent 75%)",
                                            filter:
                                                "blur(5px)",
                                            opacity:
                                            activityStyle.fireOpacity,
                                            zIndex: -2,
                                        }}
                                    />

                                    <ChatFire
                                        intensity={
                                            activity
                                        }
                                    />
                                </>
                            )}

                            <span className="relative z-10">
                                {message.displayName}
                            </span>
                        </span>

                        <span
                            style={
                                isObs
                                    ? {
                                        color:
                                        messageColor,
                                    }
                                    : undefined
                            }
                            className={
                                isObs
                                    ? undefined
                                    : "text-zinc-400"
                            }
                        >
                            :
                        </span>
                    </>
                )}

                <span
                    className={
                        message.isAction &&
                        !isObs
                            ? "italic text-zinc-300"
                            : undefined
                    }
                    style={
                        isObs
                            ? {
                                color:
                                messageColor,
                            }
                            : undefined
                    }
                >
                    <ChatMessageContent
                        message={message}
                    />
                </span>
            </div>
        </>
    );
}

function ChatFire({
                      intensity,
                  }: {
    intensity: number;
}) {
    const normalized =
        Math.max(
            0,
            Math.min(
                1,
                (intensity - 70) / 30
            )
        );

    const height =
        14 +
        normalized * 30;

    const width =
        34 +
        normalized * 70;

    const opacity =
        0.65 +
        normalized * 0.35;

    const sideSpread =
        normalized * 18;

    const emberOpacity =
        normalized >= 0.6
            ? Math.min(
                1,
                (normalized - 0.6) / 0.4
            )
            : 0;

    return (
        <svg
            className="chat-fire"
            viewBox="-30 0 160 70"
            preserveAspectRatio="none"
            style={{
                height: `${height}px`,
                width: `${width}px`,
                opacity,
            }}
            aria-hidden="true"
        >
            <g
                className="chat-fire-flame chat-fire-left"
                style={{
                    transform:
                        `translateX(${-sideSpread}px)`,
                }}
            >
                <path
                    d="M28 62C15 55 17 43 27 36C23 27 31 15 43 4C40 20 52 27 49 40C47 51 39 58 28 62Z"
                    fill="#ff3d00"
                />

                <path
                    d="M30 60C25 51 29 42 37 35C34 28 40 20 45 14C44 25 50 31 47 42C44 51 38 57 30 60Z"
                    fill="#ffb300"
                />

                <path
                    d="M34 57C32 49 36 43 41 38C40 33 43 28 46 23C47 31 48 37 45 44C43 50 39 54 34 57Z"
                    fill="#fff176"
                />
            </g>

            <g className="chat-fire-flame chat-fire-center">
                <path
                    d="M50 66C36 55 39 42 50 33C47 22 56 9 69 0C67 17 79 25 75 39C73 52 64 61 50 66Z"
                    fill="#ff3d00"
                />

                <path
                    d="M52 63C47 53 51 43 60 35C58 27 63 17 69 10C68 23 75 30 71 42C68 53 61 60 52 63Z"
                    fill="#ff9800"
                />

                <path
                    d="M56 60C54 52 58 45 63 39C62 33 66 27 68 21C70 32 70 39 67 47C65 53 61 58 56 60Z"
                    fill="#ffe082"
                />
            </g>

            <g
                className="chat-fire-flame chat-fire-right"
                style={{
                    transform:
                        `translateX(${sideSpread}px)`,
                }}
            >
                <path
                    d="M72 62C61 54 64 43 73 35C71 27 77 17 88 7C86 20 96 28 92 40C90 51 82 58 72 62Z"
                    fill="#ff3d00"
                />

                <path
                    d="M74 60C70 52 74 43 81 37C79 30 84 22 89 16C88 26 93 32 90 43C87 51 82 57 74 60Z"
                    fill="#ffb300"
                />

                <path
                    d="M78 57C76 50 80 44 84 39C83 34 87 29 89 24C90 32 90 38 87 45C85 51 82 54 78 57Z"
                    fill="#fff59d"
                />
            </g>

            {emberOpacity > 0 && (
                <g
                    className="chat-fire-embers"
                    style={{
                        opacity:
                        emberOpacity,
                    }}
                >
                    <circle
                        cx="20"
                        cy="35"
                        r="1.5"
                        fill="#ffd166"
                    />

                    <circle
                        cx="30"
                        cy="24"
                        r="1.2"
                        fill="#ff9800"
                    />

                    <circle
                        cx="42"
                        cy="17"
                        r="1.4"
                        fill="#fff176"
                    />

                    <circle
                        cx="57"
                        cy="12"
                        r="1.3"
                        fill="#ffd166"
                    />

                    <circle
                        cx="72"
                        cy="16"
                        r="1.6"
                        fill="#ffb300"
                    />

                    <circle
                        cx="86"
                        cy="25"
                        r="1.2"
                        fill="#fff176"
                    />

                    <circle
                        cx="96"
                        cy="35"
                        r="1.5"
                        fill="#ff9800"
                    />

                    <circle
                        cx="35"
                        cy="9"
                        r="1"
                        fill="#ffb300"
                    />

                    <circle
                        cx="78"
                        cy="7"
                        r="1"
                        fill="#ffd166"
                    />
                </g>
            )}
        </svg>
    );
}

function getActivityStyle(
    baseColor: string,
    activity: number
) {
    const intensity =
        Math.max(
            0,
            Math.min(
                1,
                activity / 100
            )
        );

    if (intensity <= 0) {
        return {
            color: baseColor,
            textShadow: undefined,
            filter: undefined,
            fireOpacity: "0",
        };
    }

    const hotColor =
        interpolateColor(
            baseColor,
            "#ff6a00",
            Math.min(
                1,
                intensity * 1.25
            )
        );

    const finalColor =
        interpolateColor(
            hotColor,
            "#ffd166",
            Math.max(
                0,
                (intensity - 0.45) /
                0.55
            )
        );

    const outer =
        5 +
        intensity * 20;

    const inner =
        2 +
        intensity * 8;

    return {
        color: finalColor,
        textShadow: [
            `0 0 ${inner}px rgba(255, 61, 0, ${0.5 * intensity})`,
            `0 0 ${outer}px rgba(255, 106, 0, ${0.65 * intensity})`,
            `0 0 ${outer * 1.7}px rgba(255, 179, 0, ${0.3 * intensity})`,
        ].join(", "),
        filter:
            `brightness(${1 + intensity * 0.2})`,
        fireOpacity:
            String(
                0.35 +
                intensity * 0.65
            ),
    };
}

function interpolateColor(
    from: string,
    to: string,
    amount: number
) {
    const start =
        hexToRgb(from);

    const end =
        hexToRgb(to);

    const value =
        Math.max(
            0,
            Math.min(
                1,
                amount
            )
        );

    const red =
        Math.round(
            start.r +
            (end.r - start.r) *
            value
        );

    const green =
        Math.round(
            start.g +
            (end.g - start.g) *
            value
        );

    const blue =
        Math.round(
            start.b +
            (end.b - start.b) *
            value
        );

    return `rgb(${red}, ${green}, ${blue})`;
}

function hexToRgb(
    value: string
) {
    const normalized =
        value.replace("#", "");

    if (
        normalized.length !== 6 ||
        !/^[0-9A-Fa-f]{6}$/.test(
            normalized
        )
    ) {
        return {
            r: 255,
            g: 255,
            b: 255,
        };
    }

    return {
        r: parseInt(
            normalized.substring(0, 2),
            16
        ),
        g: parseInt(
            normalized.substring(2, 4),
            16
        ),
        b: parseInt(
            normalized.substring(4, 6),
            16
        ),
    };
}

function hexToRgba(
    hex: string,
    opacity: number
): string {
    const normalized =
        hex.replace("#", "");

    if (
        normalized.length !== 6 ||
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
            normalized.substring(0, 2),
            16
        );

    const green =
        parseInt(
            normalized.substring(2, 4),
            16
        );

    const blue =
        parseInt(
            normalized.substring(4, 6),
            16
        );

    return `rgba(${red}, ${green}, ${blue}, ${
        opacity / 100
    })`;
}

function getAnimationClass(
    direction: ObsChatSettings["animationDirection"],
    speed: ObsChatSettings["animationSpeed"]
): string {
    const directionClass =
        `obs-chat-animation-${direction}`;

    const speedClass =
        `obs-chat-animation-speed-${speed}`;

    return `${directionClass} ${speedClass}`;
}