"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useParams } from "next/navigation";
import { useRouter } from "@/i18n/navigation";
import { LanguageSwitcher } from "@/components/i18n/LanguageSwitcher";
import Image from "next/image";

export default function HomePage() {
  const router = useRouter();

  const params = useParams<{
    locale: string;
  }>();

  const t = useTranslations("home");
  const tc = useTranslations("settings");

  const [platform, setPlatform] =
    useState<"twitch" | "kick">("twitch");

  const [channel, setChannel] =
    useState("");

  const [secondPlatform, setSecondPlatform] =
    useState<"twitch" | "kick">("kick");

  const [secondChannel, setSecondChannel] =
    useState("");

  const [multi, setMulti] =
    useState(false);

  const [error, setError] =
    useState<string | null>(null);

  const [settingsOpen, setSettingsOpen] =
    useState(false);

  function normalizeChannel(input: string) {
    const trimmed = input.trim();

    const twitchMatch =
      trimmed.match(
        /(?:https?:\/\/)?(?:www\.)?twitch\.tv\/([a-zA-Z0-9_]+)/i
      );

    const kickMatch =
      trimmed.match(
        /(?:https?:\/\/)?(?:www\.)?kick\.com\/([a-zA-Z0-9_]+)/i
      );

    const candidate =
      platform === "twitch"
        ? twitchMatch?.[1] ??
          trimmed.replace(/^#/, "")
        : kickMatch?.[1] ??
          trimmed.replace(/^#/, "");

    if (
      !/^[a-zA-Z0-9_]{3,25}$/.test(
        candidate
      )
    ) {
      return null;
    }

    return candidate.toLowerCase();
  }

  function handleSubmit(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    const first =
      normalizeChannel(channel);

    if (!first) {
      setError(
        t("errorInvalidChannel")
      );
      return;
    }

    if (!multi) {
      setError(null);

      router.push(
        platform === "kick"
          ? `/chat/kick/${first}`
          : `/chat/${first}`
      );

      return;
    }

    const second = (() => {
      const trimmed =
        secondChannel.trim();

      const candidate =
        trimmed
          .replace(/^#/, "")
          .toLowerCase();

      return /^[a-zA-Z0-9_]{3,25}$/.test(
        candidate
      )
        ? candidate
        : null;
    })();

    if (!second) {
      setError(
        t("errorSecondChannel")
      );
      return;
    }

    if (
      platform === secondPlatform &&
      first === second
    ) {
      setError(
        t("errorSameChannels")
      );
      return;
    }

    setError(null);

    const channels = [
      `${platform}:${first}`,
      `${secondPlatform}:${second}`,
    ];

    router.push(
      `/chat/multi-chat?channels=${encodeURIComponent(
        channels.join(",")
)}`
    );
  }

  return (
    <>
      <main className="flex min-h-screen items-center justify-center px-4 py-8">
        <div className="w-full max-w-6xl">
          <section className="mx-auto flex w-full max-w-xl flex-col items-center text-center">

            <div className="mb-8 flex flex-col items-center gap-3">
              <img
                width="96"
                height="96"
                src="https://img.icons8.com/color-glass/96/parrot.png"
                alt=""
                aria-hidden="true"
                draggable="false"
              />

              <h1 className="text-3xl font-bold tracking-tight">
                Chatteia
              </h1>
            </div>

            <p className="mb-8 max-w-md text-zinc-300">
              {t("subtitle")}
            </p>

            <form
              onSubmit={handleSubmit}
              className="w-full"
            >
              <div className="mb-3 flex items-center justify-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setMulti(false);
                    setError(null);
                  }}
                  className={`rounded-full px-4 py-2 text-sm ${
    !multi
        ? "bg-twitch-purple text-white"
        : "bg-twitch-panel text-zinc-400"
}`}
                >
                  {t("singleChat")}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setMulti(true);
                    setError(null);
                  }}
                  className={`rounded-full px-4 py-2 text-sm ${
    multi
        ? "bg-twitch-purple text-white"
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
                    onChange={(event) => {
                      setPlatform(
                        event.target.value as
                          | "twitch"
                          | "kick"
                      );
                      setError(null);
                    }}
                    className="rounded-lg border border-twitch-border bg-twitch-panel px-3 text-sm outline-none focus:border-twitch-purple"
                  >
                    <option value="twitch">
                      Twitch
                    </option>

                    <option value="kick">
                      KICK
                    </option>
                  </select>

                  <input
                    value={channel}
                    onChange={(event) => {
                      setChannel(
                        event.target.value
                      );
                      setError(null);
                    }}
                    placeholder={
                      platform === "kick"
                        ? t(
                            "kickChannelPlaceholder"
                          )
                        : t(
                            "twitchChannelPlaceholder"
                          )
                    }
                    className="min-h-12 flex-1 rounded-lg border border-twitch-border bg-twitch-panel px-4 py-3 text-base text-zinc-100 outline-none placeholder:text-zinc-500 focus:border-twitch-purple"
                  />
                </div>

                {multi && (
                  <div className="flex gap-2">
                    <select
                      value={
                        secondPlatform
                      }
                      onChange={(event) => {
                        setSecondPlatform(
                          event.target.value as
                            | "twitch"
                            | "kick"
                        );
                        setError(null);
                      }}
                      className="rounded-lg border border-twitch-border bg-twitch-panel px-3 text-sm outline-none focus:border-twitch-purple"
                    >
                      <option value="twitch">
                        Twitch
                      </option>

                      <option value="kick">
                        KICK
                      </option>
                    </select>

                    <input
                      value={
                        secondChannel
                      }
                      onChange={(event) => {
                        setSecondChannel(
                          event.target.value
                        );
                        setError(null);
                      }}
                      placeholder={t(
                        "secondChannelPlaceholder"
                      )}
                      className="min-h-12 flex-1 rounded-lg border border-twitch-border bg-twitch-panel px-4 py-3 text-base text-zinc-100 outline-none placeholder:text-zinc-500 focus:border-twitch-purple"
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
                  className="min-h-12 rounded-lg bg-twitch-purple px-6 py-3 font-semibold text-white transition-colors hover:bg-purple-600"
                >
                  {multi
                    ? t("multiChatSubmit")
                    : t("submit")}
                </button>

                  <a
                      href={`/api/platforms/kick/auth/authorize?locale=${encodeURIComponent(
                          String(params.locale ?? "pt-br")
                      )}`}
                      className="flex items-center justify-center"
                  >
                      <p className="text-xs font-bold text-zinc-500"    >
                      {t("kickStreamerAuthorize")}
                      </p>
                  </a>
              </div>
            </form>

            <p className="mt-6 text-sm text-zinc-500">
              {t("footer")}
            </p>
          </section>
        </div>
      </main>

      <div className="fixed right-1 top-1 z-50">
        {settingsOpen && (
          <div className="absolute right-0 top-14 w-64 rounded-xl border border-twitch-border bg-twitch-panel p-4 shadow-2xl">
            <h2 className="mb-4 text-sm font-semibold text-zinc-100">
              {tc("title")}
            </h2>

            <div className="flex flex-col gap-2">
              <span className="text-xs text-zinc-400">
                {tc("language")}
              </span>

              <LanguageSwitcher />
            </div>
          </div>
        )}

        <button
          type="button"
          onClick={() =>
            setSettingsOpen(
              (value) => !value
            )
          }
          aria-label={tc("open")}
          aria-expanded={
            settingsOpen
          }
          className="flex h-10 w-10 items-center justify-center text-zinc-400"
        >
          <span
            className={`text-lg transition-transform duration-200 ${
    settingsOpen
        ? "rotate-45"
        : ""
}`}
          >
            +
          </span>
        </button>
      </div>
    </>
  );
}