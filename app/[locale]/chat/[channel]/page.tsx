"use client";

import { useTranslations } from "next-intl";
import { Link, useRouter } from "@/i18n/navigation";
import { useParams } from "next/navigation";
import { useMemo, useState } from "react";

import { useTwitchChannel } from "@/hooks/useTwitchChannel";
import {
  ChatFeed,
  FeedMessage,
} from "@/components/chat/ChatFeed";
import { useTwitchChannelInfo } from "@/hooks/useTwitchChannelInfo";

export default function ChatPage() {
  const params = useParams<{ channel: string }>();
  const router = useRouter();

  const t = useTranslations("chat");
  const ts = useTranslations("chatStatus");

  const channel = (params.channel || "").toString().toLowerCase();

  const { channelInfo } = useTwitchChannelInfo(channel);

  const {
    messages,
    status,
    statusDetail,
    badgeMap,
  } = useTwitchChannel(channel);

  const [filter, setFilter] = useState("");
  const [switchTo, setSwitchTo] = useState("");

  const [showAddChannel, setShowAddChannel] = useState(false);
  const [multiChannel, setMultiChannel] = useState("");
  const [addedChannel, setAddedChannel] = useState<string | null>(null);

  const secondChat = useTwitchChannel(addedChannel || "");

  function handleSwitch(e: React.FormEvent) {
    e.preventDefault();

    const clean = switchTo
      .trim()
      .replace(/^#/, "")
      .toLowerCase();

    if (!/^[a-zA-Z0-9_]{3,25}$/.test(clean)) {
      return;
    }

    router.push(`/chat/${clean}`);
  }

  function handleAddChannel(e: React.FormEvent) {
    e.preventDefault();

    const clean = multiChannel
      .trim()
      .replace(/^#/, "")
      .toLowerCase();

    if (!/^[a-zA-Z0-9_]{3,25}$/.test(clean)) {
      return;
    }

    if (clean === channel) {
      return;
    }

    router.push(
      `/chat/multi-chat?channels=${encodeURIComponent(
    `${channel},${clean}`
)}`
    );
  }

  const visibleMessages = filter
    ? messages.filter(
        (m) =>
          m.message
            .toLowerCase()
            .includes(filter.toLowerCase()) ||
          m.displayName
            .toLowerCase()
            .includes(filter.toLowerCase())
      )
    : messages;

  const mainFeedMessages: FeedMessage[] = visibleMessages.map(
    (message) => ({
      ...message,
      badgeMap,
      channelLabel: channel,
    })
  );

  const secondFeedMessages: FeedMessage[] = addedChannel
    ? secondChat.messages.map((message) => ({
        ...message,
        badgeMap: secondChat.badgeMap,
        channelLabel: addedChannel,
      }))
    : [];

  const feedMessages = useMemo<FeedMessage[]>(() => {
    return [...mainFeedMessages, ...secondFeedMessages].sort(
      (a, b) => a.timestamp - b.timestamp
    );
  }, [mainFeedMessages, secondFeedMessages]);

  const statusLabel: Record<typeof status, string> = {
    idle: ts("idle"),
    connecting: ts("connecting"),
    connected: ts("connected"),
    reconnecting: ts("reconnecting"),
    error: ts("error"),
    closed: ts("closed"),
  };

  const statusColor: Record<typeof status, string> = {
    idle: "bg-zinc-500",
    connecting: "bg-yellow-500",
    connected: "bg-green-500",
    reconnecting: "bg-yellow-500",
    error: "bg-red-500",
    closed: "bg-zinc-500",
  };

  return (
    <main className="h-dvh flex flex-col overflow-hidden">
      <header className="sticky top-0 z-20 shrink-0 border-b border-twitch-border bg-twitch-panel px-4 py-3">
        <div className="flex flex-wrap items-center gap-3">
          <Link
            href="/"
            className="text-sm text-zinc-400 hover:text-white transition-colors"
          >
            <img
              width="32"
              height="32"
              src="https://img.icons8.com/color-glass/48/parrot.png"
              alt="parrot"
            />
          </Link>

          <div className="flex items-center gap-2">
            <h1 className="text-lg font-semibold flex items-center gap-2">
              #{channel}
            </h1>

            <button
              type="button"
              onClick={() =>
                setShowAddChannel((prev) => !prev)
              }
              title={t("addChannel")}
              aria-label={t("addChannel")}
              className="h-7 w-7 flex items-center justify-center text-zinc-500"
            >
              +
            </button>

            {addedChannel && (
              <>
                <span className="text-zinc-600">+</span>

                <span className="text-lg font-semibold">
                  #{addedChannel}
                </span>

                <button
                  type="button"
                  onClick={() => setAddedChannel(null)}
                  title={t("removeChannel")}
                  aria-label={t("removeChannel")}
                  className="text-zinc-500 hover:text-red-400 transition-colors"
                >
                  ×
                </button>
              </>
            )}
          </div>

          {showAddChannel && (
            <form
              onSubmit={handleAddChannel}
              className="flex items-center gap-2"
            >
              <input
                autoFocus
                value={multiChannel}
                onChange={(e) =>
                  setMultiChannel(e.target.value)
                }
                placeholder={t("addChannelPlaceholder")}
                className="rounded-md bg-twitch-dark border border-twitch-border px-3 py-1.5 text-sm outline-none focus:border-twitch-purple w-36 sm:w-48"
              />

              <button
                type="submit"
                className="rounded-md bg-twitch-purple px-3 py-1.5 text-sm font-medium hover:bg-purple-600 transition-colors"
              >
                {t("addChannelSubmit")}
              </button>
            </form>
          )}

          <div className="flex items-center gap-3 text-xs text-zinc-400">
            <div className="flex items-center gap-2">
              <span
                className={`h-2 w-2 rounded-full ${statusColor[status]}`}
              />

              {statusLabel[status]}
            </div>

            {channelInfo?.isLive && (
              <span className="text-zinc-400">
                {channelInfo.viewerCount.toLocaleString()}
                {" "}
                {t("viewersLive", {
                  count: "",
                }).trim()}
              </span>
            )}
          </div>

          <div className="ml-auto flex items-center gap-2">
            <input
              value={filter}
              onChange={(e) =>
                setFilter(e.target.value)
              }
              placeholder={t("searchPlaceholder")}
              className="rounded-md bg-twitch-dark border border-twitch-border px-3 py-1.5 text-sm outline-none focus:border-twitch-purple w-40 sm:w-56"
            />

            <form
              onSubmit={handleSwitch}
              className="flex items-center gap-2"
            >
              <input
                value={switchTo}
                onChange={(e) =>
                  setSwitchTo(e.target.value)
                }
                placeholder={t("switchChannelPlaceholder")}
                className="rounded-md bg-twitch-dark border border-twitch-border px-3 py-1.5 text-sm outline-none focus:border-twitch-purple w-36 sm:w-48"
              />

              <button
                type="submit"
                className="rounded-md bg-twitch-purple px-3 py-1.5 text-sm font-medium hover:bg-purple-600 transition-colors"
              >
                {t("switchChannelSubmit")}
              </button>
            </form>
          </div>
        </div>
      </header>

      {status === "error" && statusDetail && (
        <div className="shrink-0 bg-red-950/60 text-red-300 text-sm px-4 py-2 border-b border-red-900">
          {statusDetail}
        </div>
      )}

      <ChatFeed
        messages={feedMessages}
        showChannelTag={Boolean(addedChannel)}
        emptyLabel={
          status === "connected"
            ? t("waitingMessages")
            : t("connectingToChat")
        }
      />
    </main>
  );
}