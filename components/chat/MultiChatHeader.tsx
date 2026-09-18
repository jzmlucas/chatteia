"use client";

import { FormEvent } from "react";

import { Link } from "@/i18n/navigation";

import { useTranslations } from "next-intl";

import { CopyObsLinkButton } from "@/components/chat/CopyObsLinkButton";
import { ProfileMenu } from "@/components/layout/ProfileMenu";

import {
    targetKey,
    type ChatTarget,
} from "@/lib/chat/targets";

import {
    CHANNEL_COLORS,
    type MultiPlatform,
} from "@/lib/chat/multiChat";

type MultiChatHeaderProps = {
    targets: ChatTarget[];
    connectedCount: number;
    obsUrl: string;
    filter: string;
    onFilterChange: (value: string) => void;
    showAdd: boolean;
    onToggleShowAdd: () => void;
    platform: MultiPlatform;
    onPlatformChange: (
        value: MultiPlatform
    ) => void;
    newChannel: string;
    onNewChannelChange: (
        value: string
    ) => void;
    addError: string;
    channelPlaceholder: string;
    onAddChannel: (
        event: FormEvent
    ) => void;
    onRemoveTarget: (
        target: ChatTarget
    ) => void;
};

export function MultiChatHeader({
    targets,
    connectedCount,
    obsUrl,
    filter,
    onFilterChange,
    showAdd,
    onToggleShowAdd,
    platform,
    onPlatformChange,
    newChannel,
    onNewChannelChange,
    addError,
    channelPlaceholder,
    onAddChannel,
    onRemoveTarget,
}: MultiChatHeaderProps) {
    const t = useTranslations("multiChat");
    const tc = useTranslations("chat");
    const to = useTranslations("obs");

    return (
        <header className="sticky top-0 z-20 shrink-0 border-b border-twitch-border bg-twitch-panel px-4 py-3">
            <div className="flex flex-wrap items-center gap-3">
                <Link
                    href="/"
                    className="shrink-0 text-sm text-zinc-400 transition-colors hover:text-white"
                    aria-label={tc("backToHome")}
                >
                    <img
                        width="32"
                        height="32"
                        src="https://img.icons8.com/color-glass/48/parrot.png"
                        alt="Chatteia"
                    />
                </Link>

                <div className="flex min-w-0 flex-wrap items-center gap-2">
                    {targets.map((target, index) => {
                        const abbreviation =
                            target.platform === "twitch"
                                ? "TW"
                                : target.platform === "kick"
                                    ? "KI"
                                    : target.platform === "youtube"
                                        ? "YT"
                                        : "TT";

                        return (
                            <div
                                key={targetKey(target)}
                                className="flex items-center gap-1"
                            >
                                <span
                                    className="text-sm font-semibold"
                                    style={{
                                        color:
                                            CHANNEL_COLORS[
                                            index %
                                            CHANNEL_COLORS.length
                                            ],
                                    }}
                                >
                                    {abbreviation} · #{target.channel}
                                </span>

                                <button
                                    type="button"
                                    onClick={() =>
                                        onRemoveTarget(target)
                                    }
                                    className="text-zinc-500 transition-colors hover:text-white"
                                    aria-label={t(
                                        "removeChannelAria",
                                        {
                                            channel: target.channel,
                                        }
                                    )}
                                    title={t(
                                        "removeChannelAria",
                                        {
                                            channel: target.channel,
                                        }
                                    )}
                                >
                                    ×
                                </button>
                            </div>
                        );
                    })}
                </div>

                {targets.length < 4 && (
                    <button
                        type="button"
                        onClick={onToggleShowAdd}
                        className="flex h-7 w-7 items-center justify-center text-lg text-zinc-500 transition-colors hover:text-white"
                        aria-label={t("addChannel")}
                        title={t("addChannel")}
                    >
                        +
                    </button>
                )}

                {showAdd && targets.length < 4 && (
                    <form
                        onSubmit={onAddChannel}
                        className="flex flex-wrap items-center gap-2"
                    >
                        <select
                            value={platform}
                            onChange={(event) =>
                                onPlatformChange(
                                    event.target.value as MultiPlatform
                                )
                            }
                            aria-label={t("platform")}
                            className="border border-twitch-border bg-twitch-dark px-2 py-1.5 text-sm outline-none"
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
                            autoFocus
                            value={newChannel}
                            onChange={(event) =>
                                onNewChannelChange(
                                    event.target.value
                                )
                            }
                            placeholder={channelPlaceholder}
                            aria-label={channelPlaceholder}
                            className="w-52 border border-twitch-border bg-twitch-dark px-3 py-1.5 text-sm outline-none focus:border-[#F55376] sm:w-64"
                        />

                        <button
                            type="submit"
                            className="bg-[#F55376] px-3 py-1.5 text-sm font-medium transition-colors hover:bg-[#e33361]"
                        >
                            {t("addChannelSubmit")}
                        </button>

                        {addError && (
                            <div className="basis-full text-xs text-red-400">
                                {addError}
                            </div>
                        )}
                    </form>
                )}

                <div className="flex items-center gap-2 text-xs text-zinc-400">
                    <span
                        className={`h-2 w-2 ${connectedCount === targets.length &&
                                targets.length > 0
                                ? "bg-green-500"
                                : "bg-yellow-500"
                            }`}
                    />

                    {t("connectedCount", {
                        connected: connectedCount,
                        total: targets.length,
                    })}
                </div>

                <div className="ml-auto flex items-center gap-2">
                    <CopyObsLinkButton
                        url={obsUrl}
                        label={to("copyLink")}
                        copiedLabel={to("linkCopied")}
                    />

                    <input
                        value={filter}
                        onChange={(event) =>
                            onFilterChange(event.target.value)
                        }
                        placeholder={t("searchPlaceholder")}
                        aria-label={t("searchPlaceholder")}
                        className="w-40 border border-twitch-border bg-twitch-dark px-3 py-1.5 text-sm outline-none focus:border-[#F55376] sm:w-56"
                    />

                    <ProfileMenu />
                </div>
            </div>
        </header>
    );
}