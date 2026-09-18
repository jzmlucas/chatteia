"use client";

import { FormEvent } from "react";

import { useParams } from "next/navigation";

import { useTranslations } from "next-intl";

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

    const params =
        useParams<{
            locale: string;
        }>();

    return (
        <form
            onSubmit={onSubmit}
            className="w-full"
        >
            <div className="mb-3 flex items-center justify-center gap-2">
                <button
                    type="button"
                    onClick={() =>
                        onMultiChange(false)
                    }
                    className={`rounded-full px-4 py-2 text-sm ${
                        !multi
                            ? "bg-[#F55376] text-white"
                            : "bg-twitch-panel text-zinc-400"
                    }`}
                >
                    {t("singleChat")}
                </button>

                <button
                    type="button"
                    onClick={() =>
                        onMultiChange(true)
                    }
                    className={`rounded-full px-4 py-2 text-sm ${
                        multi
                            ? "bg-[#F55376] text-white"
                            : "bg-twitch-panel text-zinc-400"
                    }`}
                >
                    {t("multiChat")}
                </button>
            </div>

            <div className="flex flex-col gap-3">
                <div className="flex gap-2">
                    <select
                        value={platform}
                        onChange={(event) =>
                            onPlatformChange(
                                event.target.value as Platform
                            )
                        }
                        className="rounded-lg border border-twitch-border bg-twitch-panel px-3 text-sm outline-none focus:border-[#F55376]"
                    >
                        <option value="twitch">
                            Twitch
                        </option>

                        <option value="kick">
                            KICK
                        </option>

                        <option value="youtube">
                            YouTube
                        </option>

                        <option value="tiktok">
                            TikTok
                        </option>
                    </select>

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
                        className="min-h-12 flex-1 rounded-lg border border-twitch-border bg-twitch-panel px-4 py-3 text-base text-zinc-100 outline-none placeholder:text-zinc-500 focus:border-[#F55376]"
                    />
                </div>

                {multi && (
                    <div className="flex gap-2">
                        <select
                            value={
                                secondPlatform
                            }
                            onChange={(event) =>
                                onPlatformChange(
                                    event.target.value as Platform,
                                    true
                                )
                            }
                            className="rounded-lg border border-twitch-border bg-twitch-panel px-3 text-sm outline-none focus:border-[#F55376]"
                        >
                            <option value="twitch">
                                Twitch
                            </option>

                            <option value="kick">
                                KICK
                            </option>

                            <option value="youtube">
                                YouTube
                            </option>

                            <option value="tiktok">
                                TikTok
                            </option>
                        </select>

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
                            className="min-h-12 flex-1 rounded-lg border border-twitch-border bg-twitch-panel px-4 py-3 text-base text-zinc-100 outline-none placeholder:text-zinc-500 focus:border-[#F55376]"
                        />
                    </div>
                )}

                {error && (
                    <p className="text-left text-sm text-red-400">
                        {error}
                    </p>
                )}

                <button
                    type="submit"
                    className="min-h-12 rounded-lg bg-[#F55376] px-6 py-3 font-semibold text-white transition-colors hover:bg-[#e33361]"
                >
                    {multi
                        ? t("multiChatSubmit")
                        : t("submit")}
                </button>

                <a
                    href={`/api/platforms/kick/auth/authorize?locale=${encodeURIComponent(
                        String(
                            params.locale ??
                            "pt-br"
                        )
                    )}`}
                    className="flex items-center justify-center"
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