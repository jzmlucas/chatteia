"use client";

import { useTranslations } from "next-intl";

import { ProfileMenu } from "@/components/layout/ProfileMenu";
import {
    Link,
    useRouter,
} from "@/i18n/navigation";
import {
    useParams,
} from "next/navigation";
import {
    useMemo,
    useState,
} from "react";

import {
    useTwitchMultiChat,
} from "@/hooks/platforms/twitch/useTwitchMultiChat";

import {
    ChatFeed,
    FeedMessage,
} from "@/components/chat/ChatFeed";

import {
    useTwitchChannelInfo,
} from "@/hooks/platforms/twitch/useTwitchChannelInfo";

import {
    CopyObsLinkButton,
} from "@/components/chat/CopyObsLinkButton";

export default function ChatPage() {
    const params = useParams<{
        channel: string;
        locale: string;
    }>();

    const router = useRouter();

    const t =
        useTranslations("chat");

    const ts =
        useTranslations(
            "chatStatus"
        );

    const to =
        useTranslations("obs");

    const channel = (
        params.channel || ""
    )
        .toString()
        .toLowerCase();

    const locale =
        params.locale ||
        "pt-br";

    const {
        channelInfo,
    } =
        useTwitchChannelInfo(
            channel
        );

    const [
        addedChannel,
        setAddedChannel,
    ] =
        useState<string | null>(
            null
        );

    const chatChannels =
        addedChannel
            ? [
                channel,
                addedChannel,
            ]
            : [channel];

    const {
        connections,
    } =
        useTwitchMultiChat(
            chatChannels
        );

    const mainConnection =
        connections[channel];

    const secondConnection =
        addedChannel
            ? connections[
            addedChannel
            ]
            : null;

    const status =
        mainConnection?.status ??
        "idle";

    const statusDetail =
        mainConnection?.statusDetail;

    const messages =
        mainConnection?.messages ??
        [];

    const [filter, setFilter] =
        useState("");

    const [switchTo, setSwitchTo] =
        useState("");

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
                .replace(/^#/, "")
                .toLowerCase();

        if (
            !/^[a-zA-Z0-9_]{3,25}$/.test(
                clean
            )
        ) {
            return;
        }

        router.push(
            `/chat/twitch/${clean}`
        );
    }

    function handleAddChannel(
        e: React.FormEvent
    ) {
        e.preventDefault();

        const clean =
            multiChannel
                .trim()
                .replace(/^#/, "")
                .toLowerCase();

        if (
            !/^[a-zA-Z0-9_]{3,25}$/.test(
                clean
            )
        ) {
            return;
        }

        if (
            clean === channel
        ) {
            return;
        }

        router.push(
            `/chat/multi-chat?channels=${encodeURIComponent(
                `${channel},${clean}`
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
                const mainMessages =
                    visibleMessages.map(
                        (message) => ({
                            ...message,
                            channelLabel:
                                channel,
                        })
                    );

                const secondMessages =
                    secondConnection
                        ? secondConnection.messages.map(
                            (message) => ({
                                ...message,
                                channelLabel:
                                    addedChannel ??
                                    "",
                            })
                        )
                        : [];

                return [
                    ...mainMessages,
                    ...secondMessages,
                ].sort(
                    (a, b) =>
                        a.timestamp -
                        b.timestamp
                );
            },
            [
                visibleMessages,
                channel,
                secondConnection,
                addedChannel,
            ]
        );

    const statusLabel: Record<
        typeof status,
        string
    > = {
        idle: ts("idle"),
        connecting:
            ts("connecting"),
        connected:
            ts("connected"),
        reconnecting:
            ts("reconnecting"),
        error: ts("error"),
        closed:
            ts("closed"),
    };

    const statusColor: Record<
        typeof status,
        string
    > = {
        idle: "bg-zinc-500",
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
            ? `${window.location.origin}/${locale}/obs/${channel}`
            : `/${locale}/obs/${channel}`;

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
                            #{channel}
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
                            className="flex h-7 w-7 items-center justify-center text-zinc-500"
                        >
                            +
                        </button>

                        {addedChannel && (
                            <>
                                <span className="text-zinc-600">
                                    +
                                </span>

                                <span className="text-lg font-semibold">
                                    #{addedChannel}
                                </span>

                                <button
                                    type="button"
                                    onClick={() =>
                                        setAddedChannel(
                                            null
                                        )
                                    }
                                    title={t(
                                        "removeChannel"
                                    )}
                                    aria-label={t(
                                        "removeChannel"
                                    )}
                                    className="text-zinc-500 transition-colors hover:text-red-400"
                                >
                                    ×
                                </button>
                            </>
                        )}
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
                                onChange={(
                                    e
                                ) =>
                                    setMultiChannel(
                                        e.target
                                            .value
                                    )
                                }
                                placeholder={t(
                                    "addChannelPlaceholder"
                                )}
                                className="w-36 border border-twitch-border bg-twitch-dark px-3 py-1.5 text-sm outline-none focus:border-[#9146FF] sm:w-48"
                            />

                            <button
                                type="submit"
                                className="bg-[#9146FF] px-3 py-1.5 text-sm font-medium transition-colors hover:bg-[#a970ff]"
                            >
                                {t(
                                    "addChannelSubmit"
                                )}
                            </button>
                        </form>
                    )}

                    <div className="flex items-center gap-3 text-xs text-zinc-400">
                        <div className="flex items-center gap-2">
                            <span
                                className={`h-2 w-2 rounded-full ${statusColor[status]}`}
                            />

                            {
                                statusLabel[
                                status
                                ]
                            }
                        </div>

                        {channelInfo?.isLive && (
                            <span className="text-zinc-400">
                                {channelInfo.viewerCount.toLocaleString()}{" "}
                                {t(
                                    "viewersLive",
                                    {
                                        count: "",
                                    }
                                ).trim()}
                            </span>
                        )}
                    </div>

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
                                    e.target
                                        .value
                                )
                            }
                            placeholder={t(
                                "searchPlaceholder"
                            )}
                            className="w-40 border border-twitch-border bg-twitch-dark px-3 py-1.5 text-sm outline-none focus:border-[#9146FF] sm:w-56"
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
                                onChange={(
                                    e
                                ) =>
                                    setSwitchTo(
                                        e.target
                                            .value
                                    )
                                }
                                placeholder={t(
                                    "switchChannelPlaceholder"
                                )}
                                className="w-36 border border-twitch-border bg-twitch-dark px-3 py-1.5 text-sm outline-none focus:border-[#9146FF] sm:w-48"
                            />

                            <button
                                type="submit"
                                className="bg-[#9146FF] px-3 py-1.5 text-sm font-medium transition-colors hover:bg-[#a970ff]"
                            >
                                {t(
                                    "switchChannelSubmit"
                                )}
                            </button>
                        </form>

                        <ProfileMenu />
                    </div>
                </div>
            </header>

            {status ===
                "error" &&
                statusDetail && (
                    <div className="shrink-0 border-b border-red-900 bg-red-950/60 px-4 py-2 text-sm text-red-300">
                        {
                            statusDetail
                        }
                    </div>
                )}

            <ChatFeed
                messages={
                    feedMessages
                }
                showChannelTag={Boolean(
                    addedChannel
                )}
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