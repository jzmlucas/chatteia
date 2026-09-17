"use client";

import {
    FormEvent,
    useMemo,
    useState,
} from "react";

import {
    useParams,
    useSearchParams,
} from "next/navigation";

import {
    Link,
    useRouter,
} from "@/i18n/navigation";

import {
    useTranslations,
} from "next-intl";

import {
    useTwitchMultiChat,
} from "@/hooks/platforms/twitch/useTwitchMultiChat";

import {
    useKickMultiChat,
} from "@/hooks/platforms/kick/useKickMultiChat";

import {
    useYouTubeMultiChat,
} from "@/hooks/platforms/youtube/useYouTubeMultiChat";

import {
    ChatFeed,
    type FeedMessage,
} from "@/components/chat/ChatFeed";

import {
    CopyObsLinkButton,
} from "@/components/chat/CopyObsLinkButton";

import {
    normalizeChatTarget,
    targetKey,
    type ChatTarget,
} from "@/lib/chat/targets";

const CHANNEL_COLORS = [
    "#9146FF",
    "#53FC18",
    "#FF0000",
    "#00D4FF",
];

type MultiPlatform =
    | "twitch"
    | "kick"
    | "youtube";

type Connection = {
    status: string;
    statusDetail?: string;
    messages: FeedMessage[];
};

function prepareChannelInput(
    platform: MultiPlatform,
    value: string
) {
    const input =
        value.trim();

    if (!input) {
        return "";
    }

    if (
        platform ===
        "twitch"
    ) {
        if (
            input.startsWith("@")
        ) {
            return "";
        }

        return `twitch:${input}`;
    }

    if (
        platform ===
        "kick"
    ) {
        if (
            input.startsWith("@")
        ) {
            return "";
        }

        return `kick:${input}`;
    }

    return `youtube:${input}`;
}

export default function MultiChatPage() {
    const router =
        useRouter();

    const params =
        useParams<{
            locale: string;
        }>();

    const searchParams =
        useSearchParams();

    const t =
        useTranslations(
            "multiChat"
        );

    const tc =
        useTranslations(
            "chat"
        );

    const to =
        useTranslations(
            "obs"
        );

    const locale =
        params.locale ||
        "pt-br";

    const [
        filter,
        setFilter,
    ] = useState("");

    const [
        showAdd,
        setShowAdd,
    ] = useState(false);

    const [
        platform,
        setPlatform,
    ] =
        useState<MultiPlatform>(
            "twitch"
        );

    const [
        newChannel,
        setNewChannel,
    ] = useState("");

    const [
        addError,
        setAddError,
    ] = useState("");

    const targets =
        useMemo<
            ChatTarget[]
        >(
            () => {
                const raw =
                    searchParams.get(
                        "channels"
                    ) ?? "";

                if (!raw) {
                    return [];
                }

                return raw
                    .split(",")
                    .map(
                        normalizeChatTarget
                    )
                    .filter(
                        (
                            target
                        ): target is ChatTarget =>
                            target !==
                            null
                    )
                    .filter(
                        (
                            target,
                            index,
                            all
                        ) =>
                            all.findIndex(
                                (
                                    item
                                ) =>
                                    targetKey(
                                        item
                                    ) ===
                                    targetKey(
                                        target
                                    )
                            ) === index
                    )
                    .slice(
                        0,
                        4
                    );
            },
            [searchParams]
        );

    const twitchChannels =
        useMemo(
            () =>
                targets
                    .filter(
                        (
                            target
                        ) =>
                            target.platform ===
                            "twitch"
                    )
                    .map(
                        (
                            target
                        ) =>
                            target.channel
                    ),
            [targets]
        );

    const kickChannels =
        useMemo(
            () =>
                targets
                    .filter(
                        (
                            target
                        ) =>
                            target.platform ===
                            "kick"
                    )
                    .map(
                        (
                            target
                        ) =>
                            target.channel
                    ),
            [targets]
        );

    const youtubeChannels =
        useMemo(
            () =>
                targets
                    .filter(
                        (
                            target
                        ) =>
                            target.platform ===
                            "youtube"
                    )
                    .map(
                        (
                            target
                        ) =>
                            target.channel
                    ),
            [targets]
        );

    const twitch =
        useTwitchMultiChat(
            twitchChannels
        );

    const kick =
        useKickMultiChat(
            kickChannels
        );

    const youtube =
        useYouTubeMultiChat(
            youtubeChannels
        );

    const connectionMap =
        useMemo<
            Record<
                string,
                Connection
            >
        >(
            () => {
                const result: Record<
                    string,
                    Connection
                > = {};

                for (
                    const target of
                    targets
                ) {
                    const key =
                        targetKey(
                            target
                        );

                    let connection:
                        | Connection
                        | undefined;

                    if (
                        target.platform ===
                        "twitch"
                    ) {
                        connection =
                            twitch.connections[
                                target.channel
                            ];
                    } else if (
                        target.platform ===
                        "kick"
                    ) {
                        connection =
                            kick.connections[
                                target.channel
                            ];
                    } else {
                        connection =
                            youtube.connections[
                                target.channel
                            ];
                    }

                    result[key] = {
                        status:
                            connection
                                ?.status ??
                            "idle",
                        statusDetail:
                            connection
                                ?.statusDetail,
                        messages:
                            connection
                                ?.messages ??
                            [],
                    };
                }

                return result;
            },
            [
                targets,
                twitch.connections,
                kick.connections,
                youtube.connections,
            ]
        );

    const feedMessages =
        useMemo<
            FeedMessage[]
        >(
            () => {
                const all: FeedMessage[] =
                    [];

                targets.forEach(
                    (
                        target,
                        index
                    ) => {
                        const connection =
                            connectionMap[
                                targetKey(
                                    target
                                )
                            ];

                        const platformLabel =
                            target.platform ===
                            "twitch"
                                ? "TWITCH"
                                : target.platform ===
                                  "kick"
                                    ? "KICK"
                                    : "YOUTUBE";

                        const label =
                            `${platformLabel} · ${target.channel}`;

                        for (
                            const message of
                            connection?.messages ??
                            []
                        ) {
                            if (
                                filter
                            ) {
                                const search =
                                    filter
                                        .trim()
                                        .toLowerCase();

                                if (
                                    !message.message
                                        .toLowerCase()
                                        .includes(
                                            search
                                        ) &&
                                    !message.displayName
                                        .toLowerCase()
                                        .includes(
                                            search
                                        )
                                ) {
                                    continue;
                                }
                            }

                            all.push({
                                ...message,
                                channelLabel:
                                    label,
                                channelColor:
                                    CHANNEL_COLORS[
                                        index %
                                        CHANNEL_COLORS.length
                                    ],
                            });
                        }
                    }
                );

                return all.sort(
                    (
                        a,
                        b
                    ) =>
                        a.timestamp -
                        b.timestamp
                );
            },
            [
                targets,
                connectionMap,
                filter,
            ]
        );

    function updateUrl(
        nextTargets: ChatTarget[]
    ) {
        if (
            nextTargets.length ===
            0
        ) {
            router.push(
                "/"
            );

            return;
        }

        const channels =
            nextTargets
                .map(
                    targetKey
                )
                .join(",");

        router.replace(
            `/chat/multi-chat?channels=${encodeURIComponent(
        channels
    )}`
        );
    }

    function addChannel(
        event: FormEvent
    ) {
        event.preventDefault();

        setAddError("");

        if (
            !newChannel.trim()
        ) {
            return;
        }

        const prepared =
            prepareChannelInput(
                platform,
                newChannel
            );

        if (!prepared) {
            setAddError(
                platform ===
                    "youtube"
                    ? t(
                        "errorInvalidYouTubeInput"
                    )
                    : t(
                        "errorAtNotAllowed"
                    )
            );

            return;
        }

        const target =
            normalizeChatTarget(
                prepared
            );

        if (!target) {
            setAddError(
                platform ===
                    "youtube"
                    ? t(
                        "errorInvalidYouTubeChannel"
                    )
                    : platform ===
                      "twitch"
                        ? t(
                            "errorInvalidTwitchChannel"
                        )
                        : t(
                            "errorInvalidKickChannel"
                        )
            );

            return;
        }

        if (
            targets.some(
                (
                    item
                ) =>
                    targetKey(
                        item
                    ) ===
                    targetKey(
                        target
                    )
            )
        ) {
            setAddError(
                t(
                    "errorDuplicateChannel"
                )
            );

            return;
        }

        if (
            targets.length >=
            4
        ) {
            setAddError(
                t(
                    "errorMaxChannels"
                )
            );

            return;
        }

        updateUrl([
            ...targets,
            target,
        ]);

        setNewChannel(
            ""
        );

        setAddError("");

        setShowAdd(
            false
        );
    }

    function removeTarget(
        target: ChatTarget
    ) {
        const next =
            targets.filter(
                (
                    item
                ) =>
                    targetKey(
                        item
                    ) !==
                    targetKey(
                        target
                    )
            );

        if (
            next.length ===
            1
        ) {
            const remaining =
                next[0];

            if (
                remaining.platform ===
                "kick"
            ) {
                router.push(
                    `/chat/kick/${remaining.channel}`
                );

                return;
            }

            if (
                remaining.platform ===
                "youtube"
            ) {
                router.push(
                    `/chat/youtube/${remaining.channel}`
                );

                return;
            }

            router.push(
                `/chat/${remaining.channel}`
            );

            return;
        }

        updateUrl(
            next
        );
    }

    function handlePlatformChange(
        value: MultiPlatform
    ) {
        setPlatform(
            value
        );

        setNewChannel(
            ""
        );

        setAddError(
            ""
        );
    }

    const connectedCount =
        targets.filter(
            (
                target
            ) =>
                connectionMap[
                    targetKey(
                        target
                    )
                ]?.status ===
                "connected"
        ).length;

    const obsChannels =
        targets
            .map(
                targetKey
            )
            .join(",");

    const obsUrl =
        typeof window !==
        "undefined"
            ? `${window.location.origin}/${locale}/obs/multi-chat?channels=${encodeURIComponent(
        obsChannels
    )}`
            : `/${locale}/obs/multi-chat?channels=${encodeURIComponent(
        obsChannels
    )}`;

    const channelPlaceholder =
        platform ===
        "youtube"
            ? t(
                "youtubeChannelPlaceholder"
            )
            : platform ===
              "twitch"
                ? t(
                    "twitchChannelPlaceholder"
                )
                : t(
                    "kickChannelPlaceholder"
                );

    return (
        <main className="h-dvh flex flex-col overflow-hidden">
            <header className="sticky top-0 z-20 shrink-0 border-b border-twitch-border bg-twitch-panel px-4 py-3">
                <div className="flex flex-wrap items-center gap-3">

                    <Link
                        href="/"
                        className="shrink-0 text-sm text-zinc-400 transition-colors hover:text-white"
                        aria-label={tc(
                            "backToHome"
                        )}
                    >
                        <img
                            width="32"
                            height="32"
                            src="https://img.icons8.com/color-glass/48/parrot.png"
                            alt="Chatteia"
                        />
                    </Link>

                    <div className="flex min-w-0 flex-wrap items-center gap-2">

                        {targets.map(
                            (
                                target,
                                index
                            ) => {
                                const abbreviation =
                                    target.platform ===
                                    "twitch"
                                        ? "TW"
                                        : target.platform ===
                                          "kick"
                                            ? "KI"
                                            : "YT";

                                return (
                                    <div
                                        key={targetKey(
                                            target
                                        )}
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
                                            {
                                                abbreviation
                                            }{" "}
                                            · #
                                            {
                                                target.channel
                                            }
                                        </span>

                                        <button
                                            type="button"
                                            onClick={() =>
                                                removeTarget(
                                                    target
                                                )
                                            }
                                            className="text-zinc-500 transition-colors hover:text-white"
                                            aria-label={t(
                                                "removeChannelAria",
                                                {
                                                    channel:
                                                        target.channel,
                                                }
                                            )}
                                            title={t(
                                                "removeChannelAria",
                                                {
                                                    channel:
                                                        target.channel,
                                                }
                                            )}
                                        >
                                            ×
                                        </button>
                                    </div>
                                );
                            }
                        )}

                    </div>

                    {targets.length <
                        4 && (
                        <button
                            type="button"
                            onClick={() => {
                                setShowAdd(
                                    (
                                        value
                                    ) =>
                                        !value
                                );

                                setAddError(
                                    ""
                                );
                            }}
                            className="flex h-7 w-7 items-center justify-center rounded text-lg text-zinc-500 transition-colors hover:text-white"
                            aria-label={t(
                                "addChannel"
                            )}
                            title={t(
                                "addChannel"
                            )}
                        >
                            +
                        </button>
                    )}

                    {showAdd &&
                        targets.length <
                        4 && (
                            <form
                                onSubmit={
                                    addChannel
                                }
                                className="flex flex-wrap items-center gap-2"
                            >
                                <select
                                    value={
                                        platform
                                    }
                                    onChange={(
                                        event
                                    ) =>
                                        handlePlatformChange(
                                            event.target
                                                .value as
                                                MultiPlatform
                                        )
                                    }
                                    aria-label={t(
                                        "platform"
                                    )}
                                    className="rounded-md border border-twitch-border bg-twitch-dark px-2 py-1.5 text-sm outline-none"
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
                                </select>

                                <input
                                    autoFocus
                                    value={
                                        newChannel
                                    }
                                    onChange={(
                                        event
                                    ) => {
                                        setNewChannel(
                                            event.target
                                                .value
                                        );

                                        if (
                                            addError
                                        ) {
                                            setAddError(
                                                ""
                                            );
                                        }
                                    }}
                                    placeholder={
                                        channelPlaceholder
                                    }
                                    aria-label={
                                        channelPlaceholder
                                    }
                                    className="w-52 rounded-md border border-twitch-border bg-twitch-dark px-3 py-1.5 text-sm outline-none focus:border-twitch-purple sm:w-64"
                                />

                                <button
                                    type="submit"
                                    className="rounded-md bg-twitch-purple px-3 py-1.5 text-sm font-medium transition-colors hover:bg-purple-600"
                                >
                                    {t(
                                        "addChannelSubmit"
                                    )}
                                </button>

                                {addError && (
                                    <div className="basis-full text-xs text-red-400">
                                        {
                                            addError
                                        }
                                    </div>
                                )}
                            </form>
                        )}

                    <div className="flex items-center gap-2 text-xs text-zinc-400">

                        <span
                            className={`h-2 w-2 rounded-full ${
    connectedCount ===
    targets.length &&
    targets.length >
    0
        ? "bg-green-500"
        : "bg-yellow-500"
}`}
                        />

                        {t(
                            "connectedCount",
                            {
                                connected:
                                    connectedCount,
                                total:
                                    targets.length,
                            }
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
                            value={
                                filter
                            }
                            onChange={(
                                event
                            ) =>
                                setFilter(
                                    event.target
                                        .value
                                )
                            }
                            placeholder={t(
                                "searchPlaceholder"
                            )}
                            aria-label={t(
                                "searchPlaceholder"
                            )}
                            className="w-40 rounded-md border border-twitch-border bg-twitch-dark px-3 py-1.5 text-sm outline-none focus:border-twitch-purple sm:w-56"
                        />

                    </div>

                </div>
            </header>

            <ChatFeed
                messages={
                    feedMessages
                }
                showChannelTag
                emptyLabel={
                    targets.length ===
                    0
                        ? t(
                            "noChannels"
                        )
                        : t(
                            "waitingMessages"
                        )
                }
            />

        </main>
    );
}