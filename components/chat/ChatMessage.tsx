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
}: {
    message: FeedMessage;
    showChannelTag: boolean;
    obsSettings?: ObsChatSettings;
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

    return (
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
                    className="
                        shrink-0
                        px-1.5
                        py-0.5
                        text-[10px]
                        font-bold
                        uppercase
                        tracking-wide
                    "
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
                    <span
                        className="
                            inline-flex
                            shrink-0
                            items-center
                            gap-1
                            translate-y-[1px]
                        "
                    >
                        {message.badges.map(
                            (badge) => (
                                <img
                                    key={
                                        badge.id
                                    }
                                    src={
                                        badge.imageUrl
                                    }
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
                                    className="
                                        h-[18px]
                                        w-[18px]
                                        shrink-0
                                        object-contain
                                    "
                                />
                            )
                        )}
                    </span>
                )}

            {!isObs &&
                message.badges.length >
                0 && (
                    <span
                        className="
                            inline-flex
                            shrink-0
                            items-center
                            gap-1
                            translate-y-[1px]
                        "
                    >
                        {message.badges.map(
                            (badge) => (
                                <img
                                    key={
                                        badge.id
                                    }
                                    src={
                                        badge.imageUrl
                                    }
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
                                    className="
                                        h-[18px]
                                        w-[18px]
                                        shrink-0
                                        object-contain
                                    "
                                />
                            )
                        )}
                    </span>
                )}

            {(!isObs ||
                obsSettings.showUsername) && (
                    <>
                        <span
                            className="font-semibold"
                            style={{
                                color:
                                    usernameColor,
                            }}
                        >
                            {
                                message.displayName
                            }
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
    );
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
        return `rgba(0, 0, 0, ${opacity / 100
            })`;
    }

    const red = parseInt(
        normalized.substring(0, 2),
        16
    );

    const green = parseInt(
        normalized.substring(2, 4),
        16
    );

    const blue = parseInt(
        normalized.substring(4, 6),
        16
    );

    return `rgba(0, 0, 0, ${opacity / 100
        })`.replace(
            "0, 0, 0",
            `${red}, ${green}, ${blue}`
        );
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