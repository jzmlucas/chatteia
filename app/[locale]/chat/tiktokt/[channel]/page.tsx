"use client";

import { useTranslations } from "next-intl";
import {
    Link,
    useRouter,
} from "@/i18n/navigation";
import { useParams } from "next/navigation";
import {
    useMemo,
    useState,
} from "react";

import {
    useTikTokChannel,
} from "@/hooks/platforms/tiktok/useTiktokChannel";

import {
    ChatFeed,
    type FeedMessage,
} from "@/components/chat/ChatFeed";

import {
    CopyObsLinkButton,
} from "@/components/chat/CopyObsLinkButton";

export default function TikTokChatPage() {
    const params = useParams<{
        channel: string;
        locale: string;
    }>();

    const router = useRouter();

    const t =
        useTranslations("chat");

    const ts =
        useTranslations("chatStatus");

    const to =
        useTranslations("obs");

    const channel = (
        params.channel || ""
    )
        .toString()
        .replace(/^@/, "")
        .trim()
        .toLowerCase();

    const locale =
        params.locale ||
        "pt-br";

    const {
        messages,
        status,
        error,
    } = useTikTokChannel(
        channel
    );

    const [
        filter,
        setFilter,
    ] = useState("");

    const [
        switchTo,
        setSwitchTo,
    ] = useState("");

    const [
        showAddChannel,
        setShowAddChannel,
    ] = useState(false);

    const [
        multiChannel,
        setMultiChannel,
    ] = useState("");

    function handleSwitch(
        e: React.FormEvent
    ) {
        e.preventDefault();

        const clean =
            switchTo
                .trim()
                .replace(/^@/, "")
                .replace(/^#/, "")
                .toLowerCase();

        if (!clean) {
            return;
        }

        router.push(
            `/chat/tiktok/${encodeURIComponent(
                clean
            )}`
        );
    }

    function handleAddChannel(
        e: React.FormEvent
    ) {
        e.preventDefault();

        const clean =
            multiChannel
                .trim()
                .replace(/^@/, "")
                .replace(/^#/, "")
                .toLowerCase();

        if (!clean) {
            return;
        }

        if (
            clean ===
            channel.toLowerCase()
        ) {
            return;
        }

        router.push(
            `/chat/multi-chat?channels=${encodeURIComponent(
                `tiktok:${channel},tiktok:${clean}`
            )}`
        );
    }

    const visibleMessages =
        filter
            ? messages.filter(
                (message) =>
                    message.message
                        .toLowerCase()
                        .includes(
                            filter.toLowerCase()
                        ) ||
                    message.displayName
                        .toLowerCase()
                        .includes(
                            filter.toLowerCase()
                        )
            )
            : messages;

    const feedMessages =
        useMemo<FeedMessage[]>(
            () => {
                return visibleMessages.map(
                    (message) => ({
                        ...message,
                        channelLabel:
                        channel,
                        channelColor:
                            "#FE2C55",
                    })
                );
            },
            [
                visibleMessages,
                channel,
            ]
        );

    const statusLabel: Record<
        typeof status,
        string
    > = {
        idle:
            ts("idle"),

        connecting:
            ts("connecting"),

        connected:
            ts("connected"),

        reconnecting:
            ts("reconnecting"),

        error:
            ts("error"),

        closed:
            ts("closed"),
    };

    const statusColor: Record<
        typeof status,
        string
    > = {
        idle:
            "bg-zinc-500",

        connecting:
            "bg-yellow-500",

        connected:
            "bg-green-500",

        reconnecting:
            "bg-yellow-500",

        error:
            "bg-red-500",

        closed:
            "bg-zinc-500",
    };

    const obsUrl =
        typeof window !==
        "undefined"
            ? `${window.location.origin}/${locale}/obs/tiktok/${encodeURIComponent(
                channel
            )}`
            : `/${locale}/obs/tiktok/${encodeURIComponent(
                channel
            )}`;

    return (
        <main className="h-dvh flex flex-col overflow-hidden">

            <header className="sticky top-0 z-20 shrink-0 border-b border-twitch-border bg-twitch-panel px-4 py-3">
                <div className="flex flex-wrap items-center gap-3">

                    <Link
                        href="/"
                        className="shrink-0 text-sm text-zinc-400 transition-colors hover:text-white"
                    >
                        <img
                            width="32"
                            height="32"
                            src="https://img.icons8.com/color-glass/48/parrot.png"
                            alt="parrot"
                        />
                    </Link>

                    <div className="flex items-center gap-2">

                        <h1 className="flex items-center gap-2 text-lg font-semibold">
                            <span>
                                @
                            </span>

                            {channel}
                        </h1>

                        <button
                            type="button"
                            onClick={() =>
                                setShowAddChannel(
                                    (prev) =>
                                        !prev
                                )
                            }
                            title={t(
                                "addChannel"
                            )}
                            aria-label={t(
                                "addChannel"
                            )}
                            className="flex h-7 w-7 items-center justify-center text-zinc-500 transition-colors hover:text-white"
                        >
                            +
                        </button>

                    </div>

                    {showAddChannel && (
                        <form
                            onSubmit={
                                handleAddChannel
                            }
                            className="flex items-center gap-2"
                        >
                            <input
                                autoFocus
                                value={
                                    multiChannel
                                }
                                onChange={(e) =>
                                    setMultiChannel(
                                        e.target.value
                                    )
                                }
                                placeholder={t(
                                    "addChannelPlaceholder"
                                )}
                                className="w-36 rounded-md border border-twitch-border bg-twitch-dark px-3 py-1.5 text-sm outline-none focus:border-[#FE2C55] sm:w-48"
                            />

                            <button
                                type="submit"
                                className="rounded-md bg-[#FE2C55] px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-[#ff4f70]"
                            >
                                {t(
                                    "addChannelSubmit"
                                )}
                            </button>
                        </form>
                    )}

                    <div className="flex items-center gap-2 text-xs text-zinc-400">

                        <span
                            className={`h-2 w-2 rounded-full ${statusColor[status]}`}
                        />

                        {
                            statusLabel[
                                status
                                ]
                        }

                    </div>

                    <span className="text-xs font-medium text-[#FE2C55]">
                        TikTok
                    </span>

                    <div className="ml-auto flex items-center gap-2">

                        <CopyObsLinkButton
                            url={obsUrl}
                            label={to(
                                "copyLink"
                            )}
                            copiedLabel={to(
                                "linkCopied"
                            )}
                        />

                        <input
                            value={filter}
                            onChange={(e) =>
                                setFilter(
                                    e.target.value
                                )
                            }
                            placeholder={t(
                                "searchPlaceholder"
                            )}
                            className="w-40 rounded-md border border-twitch-border bg-twitch-dark px-3 py-1.5 text-sm outline-none focus:border-[#FE2C55] sm:w-56"
                        />

                        <form
                            onSubmit={
                                handleSwitch
                            }
                            className="flex items-center gap-2"
                        >
                            <input
                                value={
                                    switchTo
                                }
                                onChange={(e) =>
                                    setSwitchTo(
                                        e.target.value
                                    )
                                }
                                placeholder={t(
                                    "switchChannelPlaceholder"
                                )}
                                className="w-36 rounded-md border border-twitch-border bg-twitch-dark px-3 py-1.5 text-sm outline-none focus:border-[#FE2C55] sm:w-48"
                            />

                            <button
                                type="submit"
                                className="rounded-md bg-[#FE2C55] px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-[#ff4f70]"
                            >
                                {t(
                                    "switchChannelSubmit"
                                )}
                            </button>
                        </form>

                    </div>
                </div>
            </header>

            {status ===
                "error" && (
                    <div className="shrink-0 border-b border-red-900 bg-red-950/60 px-4 py-2 text-sm text-red-300">

                        <div className="font-medium">
                            Erro ao conectar ao TikTok
                        </div>

                        <div className="mt-1 text-red-400">
                            {error ||
                                "Não foi possível conectar ao chat do TikTok."}
                        </div>

                    </div>
                )}

            <ChatFeed
                messages={
                    feedMessages
                }
                showChannelTag={false}
                emptyLabel={
                    status ===
                    "connected"
                        ? t(
                            "waitingMessages"
                        )
                        : t(
                            "connectingToChat"
                        )
                }
            />

        </main>
    );
}