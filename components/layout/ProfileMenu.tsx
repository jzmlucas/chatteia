"use client";

import { useEffect, useRef, useState } from "react";

import {
    useLocale,
    useTranslations,
} from "next-intl";

import {
    Link,
    usePathname,
    useRouter,
} from "@/i18n/navigation";

import { useSearchParams } from "next/navigation";

import {
    locales,
    localeFlags,
    localeLabels,
    type AppLocale,
} from "@/i18n/config";

import { useAuth } from "@/contexts/AuthContext";

import { AvatarIcon } from "@/components/layout/AvatarIcon";
import { MaskedEmail } from "@/components/layout/MaskedEmail";

import {
    maskEmail,
    useRevealEmail,
} from "@/hooks/useRevealEmail";

export function ProfileMenu() {
    const t = useTranslations("auth");
    const tLang = useTranslations("languageSwitcher");
    const tSettings = useTranslations("settings");
    const tBilling = useTranslations("billing");

    const currentLocale =
        useLocale() as AppLocale;

    const pathname = usePathname();

    const searchParams =
        useSearchParams();

    const router = useRouter();

    const {
        user,
        profile,
        loading,
        signOut,
        isStreamer,
        isStreamerMode,
        activeMode,
        setActiveMode,
        enableStreamerMode,
        billing,
    } = useAuth();

    const [open, setOpen] =
        useState(false);

    const [
        changingMode,
        setChangingMode,
    ] = useState(false);

    const containerRef =
        useRef<HTMLDivElement>(null);

    const {
        revealed: emailRevealed,
    } = useRevealEmail();

    useEffect(() => {
        function handleClickOutside(
            event: MouseEvent
        ) {
            if (
                containerRef.current &&
                !containerRef.current.contains(
                    event.target as Node
                )
            ) {
                setOpen(false);
            }
        }

        function handleEscape(
            event: KeyboardEvent
        ) {
            if (event.key === "Escape") {
                setOpen(false);
            }
        }

        document.addEventListener(
            "mousedown",
            handleClickOutside
        );

        document.addEventListener(
            "keydown",
            handleEscape
        );

        return () => {
            document.removeEventListener(
                "mousedown",
                handleClickOutside
            );

            document.removeEventListener(
                "keydown",
                handleEscape
            );
        };
    }, []);

    function handleLocaleChange(
        locale: AppLocale
    ) {
        const params =
            searchParams.toString();

        const query = params
            ? `?${params}`
            : "";

        router.replace(
            `${pathname}${query}` as any,
            {
                locale,
            }
        );

        setOpen(false);
    }

    async function handleSignOut() {
        setOpen(false);

        await signOut();

        router.push("/");
    }

    async function handleModeToggle() {
        if (
            changingMode ||
            loading
        ) {
            return;
        }

        setChangingMode(true);

        await new Promise<void>((resolve) => {
            setTimeout(resolve, 300);
        });

        if (!isStreamer) {
            const result =
                await enableStreamerMode();

            setChangingMode(false);

            if (result === "subscription_required") {
                setOpen(false);
                router.push("/billing");
                return;
            }

            if (result === "ok") {
                setOpen(false);
            }

            return;
        }

        const nextMode =
            activeMode === "streamer"
                ? "user"
                : "streamer";

        const result =
            await setActiveMode(
                nextMode
            );

        setChangingMode(false);

        if (result === "subscription_required") {
            setOpen(false);
            router.push("/billing");
            return;
        }

        if (result === "ok") {
            setOpen(false);
        }
    }

    const isEmailFallback =
        !profile?.display_name &&
        !profile?.username &&
        !!user?.email;

    const displayLabel =
        isEmailFallback
            ? emailRevealed
                ? user?.email
                : maskEmail(user?.email)
            : profile?.display_name ||
            profile?.username ||
            null;

    const streamerActive =
        isStreamer &&
        isStreamerMode;

    return (
        <div
            ref={containerRef}
            className="relative"
        >
            <button
                type="button"
                onClick={() =>
                    setOpen(
                        (value) => !value
                    )
                }
                aria-haspopup="menu"
                aria-expanded={open}
                aria-label={tSettings(
                    "open"
                )}
                className="flex items-center justify-center outline-none ring-[#F55376] transition-shadow focus-visible:ring-2"
            >
                <AvatarIcon
                    avatarUrl={
                        profile?.avatar_url
                    }
                    label={displayLabel}
                    size={40}
                />
            </button>

            {open && (
                <div
                    role="menu"
                    className="absolute right-0 top-[calc(100%+10px)] w-64 overflow-hidden border border-twitch-border bg-twitch-panel shadow-2xl"
                >
                    <div className="flex items-center gap-3 border-b border-twitch-border px-4 py-3">
                        <AvatarIcon
                            avatarUrl={
                                profile?.avatar_url
                            }
                            label={
                                displayLabel
                            }
                            size={40}
                        />

                        <div className="min-w-0">
                            <p className="truncate text-sm font-semibold text-zinc-100">
                                {loading
                                    ? t(
                                        "loading"
                                    )
                                    : displayLabel ||
                                    t(
                                        "guest"
                                    )}
                            </p>

                            {user && (
                                <p className="truncate text-xs text-zinc-500">
                                    <MaskedEmail
                                        email={
                                            user.email
                                        }
                                    />
                                </p>
                            )}
                        </div>
                    </div>

                    {!loading &&
                        user && (
                            <>
                                <div className="border-b border-twitch-border py-1">
                                    <Link
                                        href="/"
                                        onClick={() =>
                                            setOpen(
                                                false
                                            )
                                        }
                                        className="block px-4 py-2.5 text-sm text-zinc-300 transition-colors hover:bg-zinc-800 hover:text-white"
                                    >
                                        {t("navHome")}
                                    </Link>

                                    <Link
                                        href="/account"
                                        onClick={() =>
                                            setOpen(
                                                false
                                            )
                                        }
                                        className="block px-4 py-2.5 text-sm text-zinc-300 transition-colors hover:bg-zinc-800 hover:text-white"
                                    >
                                        {t(
                                            "myAccount"
                                        )}
                                    </Link>

                                    {isStreamer && (
                                        <Link
                                            href="/profile"
                                            onClick={() =>
                                                setOpen(
                                                    false
                                                )
                                            }
                                            className="block px-4 py-2.5 text-sm text-zinc-300 transition-colors hover:bg-zinc-800 hover:text-white"
                                        >
                                            {t("navStreamerHub")}
                                        </Link>
                                    )}

                                    {isStreamer &&
                                        billing?.enforced && (
                                            <Link
                                                href="/billing"
                                                onClick={() =>
                                                    setOpen(
                                                        false
                                                    )
                                                }
                                                className="block px-4 py-2.5 text-sm text-zinc-300 transition-colors hover:bg-zinc-800 hover:text-white"
                                            >
                                                {tBilling("navLabel")}
                                            </Link>
                                        )}
                                </div>

                                <div className="border-b border-twitch-border px-4 py-3">
                                    <p className="mb-2 text-[11px] font-medium uppercase tracking-wide text-zinc-500">
                                        {t("modeLabel")}
                                    </p>

                                    <button
                                        type="button"
                                        onClick={
                                            handleModeToggle
                                        }
                                        disabled={
                                            changingMode
                                        }
                                        aria-label={
                                            streamerActive
                                                ? t("modeToggleAriaToUser")
                                                : t("modeToggleAriaToStreamer")
                                        }
                                        className="group relative w-full overflow-hidden border border-zinc-700 bg-zinc-900 p-1 transition-colors disabled:cursor-wait disabled:opacity-60"
                                    >
                                        <div
                                            className={`absolute inset-y-1 w-1/2 bg-[#F55376] shadow-lg transition-transform duration-300 ease-out ${
                                                streamerActive
                                                    ? "translate-x-full"
                                                    : "translate-x-0"
                                            }`}
                                        />

                                        <div className="relative grid grid-cols-2">
                                            <div
                                                className={`flex h-8 items-center justify-center text-[11px] font-semibold uppercase tracking-wide transition-colors duration-200 ${
                                                    !streamerActive
                                                        ? "text-white"
                                                        : "text-zinc-500"
                                                }`}
                                            >
                                                {t("modeUser")}
                                            </div>

                                            <div
                                                className={`flex h-8 items-center justify-center text-[11px] font-semibold uppercase tracking-wide transition-colors duration-200 ${
                                                    streamerActive
                                                        ? "text-white"
                                                        : "text-zinc-500"
                                                }`}
                                            >
                                                {t("modeStreamer")}
                                            </div>
                                        </div>
                                    </button>

                                    <p className="mt-2 text-center text-[10px] text-zinc-600">
                                        {changingMode
                                            ? t("modeChanging")
                                            : !isStreamer
                                                ? t("modeHintNeedsStreamer")
                                                : streamerActive
                                                    ? t("modeHintStreamerActive")
                                                    : t("modeHintUserActive")}
                                    </p>
                                </div>
                            </>
                        )}

                    {!loading &&
                        !user && (
                            <div className="border-b border-twitch-border py-1">
                                <Link
                                    href="/login"
                                    onClick={() =>
                                        setOpen(
                                            false
                                        )
                                    }
                                    className="block px-4 py-2.5 text-sm text-zinc-300 transition-colors hover:bg-zinc-800"
                                >
                                    {t(
                                        "loginSubmit"
                                    )}
                                </Link>

                                <Link
                                    href="/register"
                                    onClick={() =>
                                        setOpen(
                                            false
                                        )
                                    }
                                    className="block px-4 py-2.5 text-sm text-zinc-300 transition-colors hover:bg-zinc-800"
                                >
                                    {t(
                                        "registerLink"
                                    )}
                                </Link>
                            </div>
                        )}

                    <div className="py-2">
                        <p className="px-4 pb-1.5 text-[11px] font-medium uppercase tracking-wide text-zinc-500">
                            {tLang(
                                "label"
                            )}
                        </p>

                        <div className="grid grid-cols-2 gap-1 px-2">
                            {locales.map(
                                (
                                    locale
                                ) => {
                                    const isSelected =
                                        locale ===
                                        currentLocale;

                                    return (
                                        <button
                                            key={
                                                locale
                                            }
                                            type="button"
                                            onClick={() =>
                                                handleLocaleChange(
                                                    locale
                                                )
                                            }
                                            className={`flex items-center gap-1.5 px-2 py-1.5 text-left text-xs transition-colors ${
                                                isSelected
                                                    ? "bg-zinc-800 text-white"
                                                    : "text-zinc-400 hover:bg-zinc-800"
                                            }`}
                                        >
                                            <span className="text-sm leading-none">
                                                {
                                                    localeFlags[
                                                        locale
                                                        ]
                                                }
                                            </span>

                                            <span className="truncate">
                                                {
                                                    localeLabels[
                                                        locale
                                                        ]
                                                }
                                            </span>
                                        </button>
                                    );
                                }
                            )}
                        </div>
                    </div>

                    {!loading &&
                        user && (
                            <div className="border-t border-twitch-border py-1">
                                <button
                                    type="button"
                                    onClick={
                                        handleSignOut
                                    }
                                    className="block w-full px-4 py-2.5 text-left text-sm text-red-400 transition-colors hover:bg-zinc-800"
                                >
                                    {t(
                                        "signOut"
                                    )}
                                </button>
                            </div>
                        )}
                </div>
            )}
        </div>
    );
}