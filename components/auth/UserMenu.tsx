"use client";

import { useState } from "react";

import { useTranslations } from "next-intl";

import { Link } from "@/i18n/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { maskEmail, useRevealEmail } from "@/hooks/useRevealEmail";

export function UserMenu() {
    const t = useTranslations("auth");

    const { user, profile, loading, signOut } = useAuth();

    const [open, setOpen] = useState(false);

    if (loading) {
        return null;
    }

    if (!user) {
        return (
            <div className="flex items-center gap-2">
                <Link
                    href="/login"
                    className="rounded-lg border border-twitch-border px-3 py-2 text-xs font-medium text-zinc-200 hover:border-zinc-500"
                >
                    {t("loginSubmit")}
                </Link>

                <Link
                    href="/register"
                    className="rounded-lg bg-[#F55376] px-3 py-2 text-xs font-medium text-white hover:opacity-90"
                >
                    {t("registerLink")}
                </Link>
            </div>
        );
    }

    const { revealed: emailRevealed } = useRevealEmail();

    const isEmailFallback =
        !profile?.display_name && !profile?.username;

    const label = isEmailFallback
        ? emailRevealed
            ? user.email
            : maskEmail(user.email)
        : profile?.display_name || profile?.username;

    return (
        <div className="relative">
            <button
                type="button"
                onClick={() => setOpen((value) => !value)}
                aria-expanded={open}
                className="flex items-center gap-2 rounded-lg border border-twitch-border bg-twitch-panel px-3 py-2 text-xs font-medium text-zinc-100 hover:border-zinc-500"
            >
                <span className="max-w-[120px] truncate">
                    {label}
                </span>

                {profile?.account_type === "streamer" && (
                    <span className="rounded bg-[#F55376]/20 px-1.5 py-0.5 text-[10px] text-[#F55376]">
                        {t("accountTypeStreamer")}
                    </span>
                )}
            </button>

            {open && (
                <div className="absolute right-0 top-[calc(100%+8px)] w-48 overflow-hidden rounded-lg border border-twitch-border bg-twitch-panel py-1 shadow-2xl">
                    <Link
                        href="/account"
                        onClick={() => setOpen(false)}
                        className="block px-4 py-2.5 text-sm text-zinc-300 hover:bg-zinc-800"
                    >
                        {t("myAccount")}
                    </Link>

                    <button
                        type="button"
                        onClick={() => {
                            setOpen(false);
                            signOut();
                        }}
                        className="block w-full px-4 py-2.5 text-left text-sm text-red-400 hover:bg-zinc-800"
                    >
                        {t("signOut")}
                    </button>
                </div>
            )}
        </div>
    );
}
