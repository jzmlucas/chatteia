"use client";

import { useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";

import { Link, useRouter } from "@/i18n/navigation";

import { useKickChannel } from "@/hooks/platforms/kick/useKickChannel";

import {
  ChatFeed,
  type FeedMessage,
} from "@/components/chat/ChatFeed";

export default function KickChatPage() {
  const params = useParams<{
    channel: string;
    locale: string;
  }>();

  const router = useRouter();

  const t = useTranslations("chat");
  const ts = useTranslations("chatStatus");
  const tk = useTranslations("kick");

  const channel = String(
      params.channel ?? ""
  )
      .toLowerCase();

  const {
    messages,
    status,
    statusDetail,
  } = useKickChannel(channel);

  const [filter, setFilter] =
      useState("");

  const [switchTo, setSwitchTo] =
      useState("");

  function handleSwitch(
      event: React.FormEvent
  ) {
    event.preventDefault();

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
        `/kick/${clean}`
    );
  }

  const feedMessages =
      useMemo<FeedMessage[]>(() => {
        const search =
            filter.trim().toLowerCase();

        return messages
            .filter((message) => {
              if (!search) {
                return true;
              }

              return (
                  message.message
                      .toLowerCase()
                      .includes(search) ||
                  message.displayName
                      .toLowerCase()
                      .includes(search)
              );
            })
            .map((message) => ({
              ...message,
              channelLabel:
              channel,
              channelColor:
                  "#53FC18",
            }));
      }, [
        messages,
        filter,
        channel,
      ]);

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

            <h1 className="flex items-center gap-2 text-lg font-semibold">
              #{channel}
            </h1>

            <div className="flex items-center gap-2 text-xs text-zinc-400">
                        <span
                            className={`h-2 w-2 rounded-full ${statusColor[status]}`}
                        />

              {statusLabel[status]}
            </div>

            <div className="ml-auto flex items-center gap-2">

              <input
                  value={filter}
                  onChange={(event) =>
                      setFilter(
                          event.target.value
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
                  className="flex items-center gap-2"
              >
                <input
                    value={
                      switchTo
                    }
                    onChange={(
                        event
                    ) =>
                        setSwitchTo(
                            event.target.value
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

        {status === "error" && (
            <div className="shrink-0 border-b border-red-900 bg-red-950/60 px-4 py-3 text-sm text-red-300">
              <div className="font-medium">
                {tk(
                    "authorizationRequired"
                )}
              </div>

              <div className="mt-1 text-red-400">
                {statusDetail ||
                    tk(
                        "authorizationDescription"
                    )}
              </div>
            </div>
        )}

        <ChatFeed
            messages={feedMessages}
            showChannelTag={false}
            emptyLabel={
              status === "connected"
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