"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";

import { LanguageSwitcher } from "@/components/i18n/LanguageSwitcher";

export default function HomePage() {
    const router = useRouter();
    const t = useTranslations("home");
    const tc = useTranslations("settings");

    const [channel, setChannel] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [settingsOpen, setSettingsOpen] = useState(false);

    function normalizeChannel(input: string): string | null {
        const trimmed = input.trim();

        if (!trimmed) {
            return null;
        }

        const match = trimmed.match(
            /(?:https?:\/\/)?(?:www\.)?twitch\.tv\/([a-zA-Z0-9_]+)/i
        );

        const candidate = match
            ? match[1]
            : trimmed.replace(/^#/, "");

        if (!/^[a-zA-Z0-9_]{3,25}$/.test(candidate)) {
            return null;
        }

        return candidate.toLowerCase();
    }

    function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();

        const normalized = normalizeChannel(channel);

        if (!normalized) {
            setError(t("errorInvalidChannel"));
            return;
        }

        setError(null);

        router.push(`/chat/${normalized}`);
    }

    function handleChannelChange(
        e: React.ChangeEvent<HTMLInputElement>
    ) {
        setChannel(e.target.value);

        if (error) {
            setError(null);
        }
    }

    return (
        <>
            <main className="flex min-h-screen items-center justify-center px-4 py-8">
                <div className="w-full max-w-6xl">
                    <section
                        aria-labelledby="page-title"
                        className="mx-auto flex w-full max-w-xl flex-col items-center text-center"
                    >
                        <div className="mb-8 flex flex-col items-center gap-3">
                            <img
                                width="96"
                                height="96"
                                src="https://img.icons8.com/color-glass/96/parrot.png"
                                alt=""
                                aria-hidden="true"
                                draggable="false"
                            />

                            <h1
                                id="page-title"
                                className="text-3xl font-bold tracking-tight"
                            >
                                {t("title")}
                            </h1>
                        </div>

                        <p
                            id="channel-description"
                            className="mb-8 max-w-md text-zinc-300"
                        >
                            {t("subtitle")}
                        </p>

                        <form
                            onSubmit={handleSubmit}
                            className="w-full"
                            aria-labelledby="form-title"
                            noValidate
                        >
                            <h2
                                id="form-title"
                                className="sr-only"
                            >
                                {t("channelLabel")}
                            </h2>

                            <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
                                <div className="flex-1 text-left">
                                    <input
                                        id="channel"
                                        name="channel"
                                        type="text"
                                        inputMode="text"
                                        autoFocus
                                        autoComplete="off"
                                        spellCheck={false}
                                        value={channel}
                                        onChange={handleChannelChange}
                                        placeholder={t("channelPlaceholder")}
                                        aria-describedby="channel-description channel-error"
                                        aria-invalid={error !== null}
                                        aria-errormessage={
                                            error ? "channel-error" : undefined
                                        }
                                        className={`
w-full rounded-lg border
bg-twitch-panel
px-4 py-3
text-base text-zinc-100
outline-none
transition-colors
placeholder:text-zinc-500
hover:border-zinc-500
focus-visible:outline-none
focus-visible:ring-2
focus-visible:ring-offset-2
focus-visible:ring-offset-black
motion-reduce:transition-none
${
    error
        ? "border-red-500 focus-visible:border-red-500 focus-visible:ring-red-500"
        : "border-twitch-border focus-visible:border-twitch-purple focus-visible:ring-twitch-purple"
}
`}
                                    />

                                    <p
                                        id="channel-error"
                                        aria-live="polite"
                                        aria-atomic="true"
                                        className={`
mt-2 min-h-5 text-sm text-red-400
${error ? "block" : "invisible"}
`}
                                    >
                                        {error || "\u00A0"}
                                    </p>
                                </div>

                                <button
                                    type="submit"
                                    className="
                                        min-h-12
                                        rounded-lg
                                        bg-twitch-purple
                                        px-6
                                        py-3
                                        font-semibold
                                        text-white
                                        transition-colors
                                        hover:bg-purple-600
                                        focus-visible:outline-none
                                        focus-visible:ring-2
                                        focus-visible:ring-twitch-purple
                                        focus-visible:ring-offset-2
                                        focus-visible:ring-offset-black
                                        active:scale-[0.98]
                                        motion-reduce:transform-none
                                        motion-reduce:transition-none
                                    "
                                >
                                    {t("submit")}
                                </button>
                            </div>
                        </form>

                        <p className="mt-10 text-sm text-zinc-400">
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
                        setSettingsOpen((value) => !value)
                    }
                    aria-label={tc("open")}
                    aria-expanded={settingsOpen}
                    className="
            flex
            h-10
            w-10
            items-center
            justify-center
            text-zinc-400
            transition-colors
        "
                >
        <span
            aria-hidden="true"
            className={`
                text-lg
                transition-transform
                duration-200
                ${settingsOpen ? "rotate-45" : ""}
            `}
        >
            +
        </span>
                </button>
            </div>
        </>
    );
}