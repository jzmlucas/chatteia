"use client";

import { FormEvent } from "react";

import { useParams } from "next/navigation";

import { useTranslations } from "next-intl";

import {
    ChatSelect,
    ChatSelectContent,
    ChatSelectItem,
    ChatSelectTrigger,
    ChatSelectValue,
} from "@/components/motion/ChatSelect";

import type { Platform } from "@/lib/chat/normalizeChannel";

type HomeChatFormProps = {
    platform: Platform;
    channel: string;
    onChannelChange: (value: string) => void;
    secondPlatform: Platform;
    secondChannel: string;
    onSecondChannelChange: (value: string) => void;
    multi: boolean;
    onMultiChange: (value: boolean) => void;
    error: string | null;
    channelPlaceholder: string;
    secondChannelPlaceholder: string;
    onSubmit: (event: FormEvent<HTMLFormElement>) => void;
    onPlatformChange: (
        value: Platform,
        second?: boolean
    ) => void;
};

export function HomeChatForm({
    platform,
    channel,
    onChannelChange,
    secondPlatform,
    secondChannel,
    onSecondChannelChange,
    multi,
    onMultiChange,
    error,
    channelPlaceholder,
    secondChannelPlaceholder,
    onSubmit,
    onPlatformChange,
}: HomeChatFormProps) {
    const t = useTranslations("home");

    const params = useParams<{
        locale: string;
    }>();

    return (
        <form
            onSubmit={onSubmit}
            className="w-full"
        >
            {/* Single / Multi */}
            <div className="mb-3 flex items-center justify-center gap-2">
                <button
                    type="button"
                    onClick={() =>
                        onMultiChange(false)
                    }
                    className={`
                        px-4 py-2
                        text-sm
                        transition-all
                        duration-200
                        ${
                            !multi
                                ? "bg-[#F55376] text-white shadow-[0_0_18px_rgba(245,83,118,0.18)]"
                                : "bg-twitch-panel text-zinc-400 hover:text-zinc-200"
                        }
                    `}
                >
                    {t("singleChat")}
                </button>

                <button
                    type="button"
                    onClick={() =>
                        onMultiChange(true)
                    }
                    className={`
                        px-4 py-2
                        text-sm
                        transition-all
                        duration-200
                        ${
                            multi
                                ? "bg-[#F55376] text-white shadow-[0_0_18px_rgba(245,83,118,0.18)]"
                                : "bg-twitch-panel text-zinc-400 hover:text-zinc-200"
                        }
                    `}
                >
                    {t("multiChat")}
                </button>
            </div>

            <div className="flex flex-col gap-3">
                {/* Primeiro canal */}
                <div className="flex gap-2">
                    <div className="w-[132px] shrink-0">
                        <ChatSelect
                            value={platform}
                            onValueChange={(value) =>
                                onPlatformChange(
                                    value as Platform
                                )
                            }
                        >
                            <ChatSelectTrigger className="h-12">
                                <ChatSelectValue />
                            </ChatSelectTrigger>

                            <ChatSelectContent>
                                <ChatSelectItem value="twitch">
                                    Twitch
                                </ChatSelectItem>

                                <ChatSelectItem value="kick">
                                    KICK
                                </ChatSelectItem>

                                <ChatSelectItem value="youtube">
                                    YouTube
                                </ChatSelectItem>

                                <ChatSelectItem value="tiktok">
                                    TikTok
                                </ChatSelectItem>
                            </ChatSelectContent>
                        </ChatSelect>
                    </div>

                    <input
                        value={channel}
                        onChange={(event) =>
                            onChannelChange(
                                event.target.value
                            )
                        }
                        placeholder={
                            channelPlaceholder
                        }
                        className="
                            min-h-12
                            flex-1
                            border border-twitch-border
                            bg-twitch-panel
                            px-4 py-3
                            text-base
                            text-zinc-100
                            outline-none
                            transition-colors
                            duration-200
                            placeholder:text-zinc-500
                            focus:border-[#F55376]
                        "
                    />
                </div>

                {/* Segundo canal */}
                {multi && (
                    <div className="flex gap-2">
                        <div className="w-[132px] shrink-0">
                            <ChatSelect
                                value={
                                    secondPlatform
                                }
                                onValueChange={(
                                    value
                                ) =>
                                    onPlatformChange(
                                        value as Platform,
                                        true
                                    )
                                }
                            >
                                <ChatSelectTrigger className="h-12">
                                    <ChatSelectValue />
                                </ChatSelectTrigger>

                                <ChatSelectContent>
                                    <ChatSelectItem value="twitch">
                                        Twitch
                                    </ChatSelectItem>

                                    <ChatSelectItem value="kick">
                                        KICK
                                    </ChatSelectItem>

                                    <ChatSelectItem value="youtube">
                                        YouTube
                                    </ChatSelectItem>

                                    <ChatSelectItem value="tiktok">
                                        TikTok
                                    </ChatSelectItem>
                                </ChatSelectContent>
                            </ChatSelect>
                        </div>

                        <input
                            value={
                                secondChannel
                            }
                            onChange={(event) =>
                                onSecondChannelChange(
                                    event.target.value
                                )
                            }
                            placeholder={
                                secondChannelPlaceholder
                            }
                            className="
                                min-h-12
                                flex-1
                                border border-twitch-border
                                bg-twitch-panel
                                px-4 py-3
                                text-base
                                text-zinc-100
                                outline-none
                                transition-colors
                                duration-200
                                placeholder:text-zinc-500
                                focus:border-[#F55376]
                            "
                        />
                    </div>
                )}

                {/* Erro */}
                {error && (
                    <p
                        role="alert"
                        className="
                            text-left
                            text-sm
                            text-red-400
                        "
                    >
                        {error}
                    </p>
                )}

                {/* Submit */}
                <button
                    type="submit"
                    className="
                        group
                        relative
                        min-h-12
                        overflow-hidden
                        bg-[#F55376]
                        px-6 py-3
                        font-semibold
                        text-white
                        transition-all
                        duration-300
                        ease-out
                        hover:-translate-y-0.5
                        hover:bg-[#ff6687]
                        hover:shadow-[0_0_25px_rgba(245,83,118,0.45)]
                        active:translate-y-0
                        active:scale-[0.99]
                    "
                >
                    {/* Brilho que atravessa o botão */}
                    <span
                        aria-hidden="true"
                        className="
                            absolute
                            inset-0
                            -translate-x-full
                            bg-gradient-to-r
                            from-transparent
                            via-white/20
                            to-transparent
                            transition-transform
                            duration-700
                            group-hover:translate-x-full
                        "
                    />

                    {/* Glow */}
                    <span
                        aria-hidden="true"
                        className="
                            absolute
                            inset-0
                            bg-[#F55376]
                            opacity-0
                            blur-xl
                            transition-opacity
                            duration-300
                            group-hover:animate-pulse
                            group-hover:opacity-60
                        "
                    />

                    <span className="relative z-10">
                        {multi
                            ? t(
                                  "multiChatSubmit"
                              )
                            : t("submit")}
                    </span>
                </button>

                {/* Autorização KICK */}
                <a
                    href={`/api/platforms/kick/auth/authorize?locale=${encodeURIComponent(
                        String(
                            params.locale ??
                                "pt-br"
                        )
                    )}`}
                    className="
                        flex
                        items-center
                        justify-center
                        transition-opacity
                        hover:opacity-80
                    "
                >
                    <p className="text-xs font-bold text-zinc-500">
                        {t(
                            "kickStreamerAuthorize"
                        )}
                    </p>
                </a>
            </div>
        </form>
    );
}
