"use client";

import { useTranslations } from "next-intl";
import {
  Link,
  useRouter,
} from "@/i18n/navigation";
import {
  useParams,
  useSearchParams,
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
  CopyObsLinkButton,
} from "@/components/chat/CopyObsLinkButton";

const CHANNEL_COLORS = [
  "#9146FF",
  "#00D4FF",
  "#00E676",
  "#FF9800",
];

export default function MultiChatPage() {
  const router = useRouter();
  const searchParams =
    useSearchParams();

  const params = useParams<{
    locale: string;
  }>();

  const t =
    useTranslations("chat");

  const tm =
    useTranslations("multiChat");

  const to =
    useTranslations("obs");

  const initialChannels =
    useMemo(() => {
      return (
        searchParams.get(
          "channels"
        ) || ""
      )
        .split(",")
        .map((channel) =>
          channel
            .trim()
            .replace(/^#/, "")
            .toLowerCase()
        )
        .filter((channel) =>
          /^[a-zA-Z0-9_]{3,25}$/.test(
            channel
          )
        )
        .slice(0, 4);
    }, [searchParams]);

  const [channels, setChannels] =
    useState<string[]>(
      initialChannels
    );

  const [filter, setFilter] =
    useState("");

  const [switchTo, setSwitchTo] =
    useState("");

  const [showAddChannel, setShowAddChannel] =
    useState(false);

  const [newChannel, setNewChannel] =
    useState("");

  const {
    connections,
  } = useTwitchMultiChat(
    channels
  );

  const feedMessages =
    useMemo<FeedMessage[]>(() => {
      const allMessages: FeedMessage[] =
        [];

      channels.forEach(
        (channel, index) => {
          const connection =
            connections[channel];

          if (!connection) {
            return;
          }

          connection.messages.forEach(
            (message) => {
              const matchesFilter =
                !filter ||
                message.message
                  .toLowerCase()
                  .includes(
                    filter.toLowerCase()
                  ) ||
                message.displayName
                  .toLowerCase()
                  .includes(
                    filter.toLowerCase()
                  );

              if (!matchesFilter) {
                return;
              }

              allMessages.push({
                ...message,
                channelLabel:
                  channel,
                channelColor:
                  CHANNEL_COLORS[
                    index %
                      CHANNEL_COLORS.length
                  ],
              });
            }
          );
        }
      );

      return allMessages.sort(
        (a, b) =>
          a.timestamp -
          b.timestamp
      );
    }, [
      channels,
      connections,
      filter,
    ]);

  function updateUrl(
    nextChannels: string[]
  ) {
    if (
      nextChannels.length === 0
    ) {
      router.push("/");
      return;
    }

    router.replace(
      `/chat/multi-chat?channels=${encodeURIComponent(
        nextChannels.join(",")
)}`
    );
  }

  function addChannel(
    channel: string
  ) {
    const clean = channel
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

    setChannels((current) => {
      if (current.includes(clean)) {
        return current;
      }

      if (current.length >= 4) {
        return current;
      }

      const next = [
        ...current,
        clean,
      ];

      updateUrl(next);

      return next;
    });

    setNewChannel("");
    setShowAddChannel(false);
  }

  function handleAddChannel(
    e: React.FormEvent
  ) {
    e.preventDefault();

    addChannel(newChannel);
  }

  function removeChannel(
    channel: string
  ) {
    const next =
      channels.filter(
        (item) =>
          item !== channel
      );

    if (next.length === 1) {
      router.push(
        `/chat/${next[0]}`
      );
      return;
    }

    if (next.length === 0) {
      router.push("/");
      return;
    }

    setChannels(next);

    router.replace(
      `/chat/multi-chat?channels=${encodeURIComponent(
        next.join(",")
)}`
    );
  }

  function handleSwitch(
    e: React.FormEvent
  ) {
    e.preventDefault();

    const clean = switchTo
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
      `/chat/${clean}`
    );
  }

  const connectedCount =
    channels.filter(
      (channel) =>
        connections[channel]
          ?.status === "connected"
    ).length;

  const obsUrl =
    typeof window !==
    "undefined"
      ? `${window.location.origin}/${params.locale}/obs/multi-chat?channels=${encodeURIComponent(
        channels.join(",")
)}`
      : "";

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

          <div className="flex min-w-0 items-center gap-2 overflow-hidden">
            {channels.map(
              (
                channel,
                index
              ) => (
                <div
                  key={channel}
                  className="flex shrink-0 items-center gap-1"
                >
                  <span
                    className="text-lg font-semibold"
                    style={{
                      color:
                        CHANNEL_COLORS[
                          index %
                            CHANNEL_COLORS.length
                        ],
                    }}
                  >
                    #{channel}
                  </span>

                  <button
                    type="button"
                    onClick={() =>
                      removeChannel(
                        channel
                      )
                    }
                    title={tm(
                      "removeChannelAria",
                      {
                        channel,
                      }
                    )}
                    aria-label={tm(
                      "removeChannelAria",
                      {
                        channel,
                      }
                    )}
                    className="flex h-5 w-5 items-center justify-center rounded text-zinc-500 hover:text-white"
                  >
                    ×
                  </button>
                </div>
              )
            )}
          </div>

          {channels.length <
            4 && (
            <>
              <button
                type="button"
                onClick={() =>
                  setShowAddChannel(
                    (current) =>
                      !current
                  )
                }
                title={tm(
                  "addChannel"
                )}
                aria-label={tm(
                  "addChannel"
                )}
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded text-lg text-zinc-500 hover:text-white"
              >
                +
              </button>

              {showAddChannel && (
                <form
                  onSubmit={
                    handleAddChannel
                  }
                  className="flex shrink-0 items-center gap-2"
                >
                  <input
                    autoFocus
                    value={
                      newChannel
                    }
                    onChange={(e) =>
                      setNewChannel(
                        e.target.value
                      )
                    }
                    placeholder={tm(
                      "addChannelPlaceholder"
                    )}
                    className="w-36 rounded-md border border-twitch-border bg-twitch-dark px-3 py-1.5 text-sm outline-none focus:border-twitch-purple sm:w-48"
                  />

                  <button
                    type="submit"
                    className="rounded-md bg-twitch-purple px-3 py-1.5 text-sm font-medium transition-colors hover:bg-purple-600"
                  >
                    {tm(
                      "addChannelSubmit"
                    )}
                  </button>
                </form>
              )}
            </>
          )}

          <div className="flex shrink-0 items-center gap-2 text-xs text-zinc-400">
            <span
              className={`h-2 w-2 rounded-full ${
    connectedCount ===
    channels.length &&
    channels.length > 0
        ? "bg-green-500"
        : "bg-yellow-500"
}`}
            />

            {tm(
              "connectedCount",
              {
                connected:
                  connectedCount,
                total:
                  channels.length,
              }
            )}
          </div>

          <div className="ml-auto flex shrink-0 items-center gap-2">
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
              className="w-40 rounded-md border border-twitch-border bg-twitch-dark px-3 py-1.5 text-sm outline-none focus:border-twitch-purple sm:w-56"
            />

            <form
              onSubmit={
                handleSwitch
              }
              className="flex shrink-0 items-center gap-2"
            >
              <input
                value={switchTo}
                onChange={(e) =>
                  setSwitchTo(
                    e.target.value
                  )
                }
                placeholder={t(
                  "switchChannelPlaceholder"
                )}
                className="w-36 rounded-md border border-twitch-border bg-twitch-dark px-3 py-1.5 text-sm outline-none focus:border-twitch-purple sm:w-48"
              />

              <button
                type="submit"
                className="rounded-md bg-twitch-purple px-3 py-1.5 text-sm font-medium transition-colors hover:bg-purple-600"
              >
                {t(
                  "switchChannelSubmit"
                )}
              </button>
            </form>
          </div>
        </div>
      </header>

      <ChatFeed
        messages={feedMessages}
        showChannelTag
        emptyLabel={
          channels.length === 0
            ? tm("noChannels")
            : tm(
                "waitingMessages"
              )
        }
      />
    </main>
  );
}