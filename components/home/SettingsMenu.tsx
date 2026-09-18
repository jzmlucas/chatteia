"use client";

import { useState } from "react";

import { useTranslations } from "next-intl";

import { LanguageSwitcher } from "@/components/i18n/LanguageSwitcher";
import { UserMenu } from "@/components/auth/UserMenu";

export function SettingsMenu() {
    const tc = useTranslations("settings");

    const [settingsOpen, setSettingsOpen] = useState(false);

    return (
        <>
            <div className="fixed left-3 top-16 z-50 sm:left-5 sm:top-[4.5rem]">
                <UserMenu />
            </div>

            <div className="fixed right-1 top-1 z-50">
                {settingsOpen && (
                    <div className="absolute right-0 top-14 w-64 border border-twitch-border bg-twitch-panel p-4 shadow-2xl">
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
                    className="flex h-10 w-10 items-center justify-center text-zinc-400"
                >
                    <span
                        className={`text-lg transition-transform duration-200 ${settingsOpen ? "rotate-45" : ""
                            }`}
                    >
                        +
                    </span>
                </button>
            </div>
        </>
    );
}