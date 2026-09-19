"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";

import { useAuth } from "@/contexts/AuthContext";
import { useAccountForm } from "@/hooks/auth/useAccountForm";
import { MaskedEmail } from "@/components/layout/MaskedEmail";
import { PlatformConnections } from "@/components/account/PlatformConnections";

export function AccountPanel() {
    const t = useTranslations("auth");
    const router = useRouter();

    const {
        user,
        profile,
        activeMode,
        signOut,
    } = useAuth();

    const {
        displayName,
        setDisplayName,
        bio,
        setBio,
        avatarUrl,
        setAvatarUrl,
        error,
        success,
        saving,
        handleSubmit,
    } = useAccountForm();

    const [showAvatarUrl, setShowAvatarUrl] =
        useState(false);

    const isStreamerMode =
        activeMode === "streamer";

    async function handleSignOut() {
        await signOut();
        router.push("/");
    }

    return (
        <div className="w-full max-w-lg border border-twitch-border bg-twitch-panel p-6 shadow-2xl">
            <div className="mb-6 flex items-center gap-4">
                <img
                    src={
                        avatarUrl ||
                        "https://img.icons8.com/color-glass/96/parrot.png"
                    }
                    alt=""
                    className="h-16 w-16 border border-twitch-border object-cover"
                />

                <div className="min-w-0">
                    <h1 className="truncate text-lg font-bold text-zinc-100">
                        {displayName ||
                            profile?.display_name ||
                            profile?.username}
                    </h1>

                    <p className="text-sm text-zinc-400">
                        @{profile?.username}
                    </p>

                    <span className="mt-1 inline-block bg-[#F55376]/20 px-2 py-0.5 text-[11px] text-[#F55376]">
                        {isStreamerMode
                            ? t("accountTypeStreamer")
                            : t("accountTypeUser")}
                    </span>
                </div>
            </div>

            <p className="mb-6 text-sm text-zinc-500">
                <MaskedEmail
                    email={user?.email}
                    prefix={t("accountEmailPrefix")}
                />
            </p>

            <form
                onSubmit={handleSubmit}
                className="flex flex-col gap-4"
            >
                <div>
                    <label
                        htmlFor="displayName"
                        className="mb-1.5 block text-xs font-medium text-zinc-400"
                    >
                        {t("displayNameLabel")}
                    </label>

                    <input
                        id="displayName"
                        type="text"
                        value={displayName}
                        onChange={(event) =>
                            setDisplayName(
                                event.target.value
                            )
                        }
                        className="w-full border border-twitch-border bg-zinc-900 px-3 py-2.5 text-sm text-zinc-100 outline-none transition-colors focus:border-[#F55376]"
                    />
                </div>

                <div>
                    <label
                        htmlFor="bio"
                        className="mb-1.5 block text-xs font-medium text-zinc-400"
                    >
                        {t("bioLabel")}
                    </label>

                    <textarea
                        id="bio"
                        value={bio}
                        onChange={(event) =>
                            setBio(event.target.value)
                        }
                        rows={4}
                        className="w-full resize-none border border-twitch-border bg-zinc-900 px-3 py-2.5 text-sm text-zinc-100 outline-none transition-colors focus:border-[#F55376]"
                    />
                </div>

                <div>
                    <div className="mb-1.5 flex items-center justify-between">
                        <label
                            htmlFor="avatarUrl"
                            className="block text-xs font-medium text-zinc-400"
                        >
                            {t("avatarUrlLabel")}
                        </label>

                        <button
                            type="button"
                            onClick={() =>
                                setShowAvatarUrl(
                                    (value) =>
                                        !value
                                )
                            }
                            className="text-[11px] text-zinc-500 transition-colors hover:text-zinc-300"
                        >
                            {showAvatarUrl
                                ? t("avatarUrlHideButton")
                                : t("avatarUrlChangeButton")}
                        </button>
                    </div>

                    {showAvatarUrl && (
                        <input
                            id="avatarUrl"
                            type="url"
                            value={avatarUrl}
                            onChange={(event) =>
                                setAvatarUrl(
                                    event.target.value
                                )
                            }
                            placeholder="https://..."
                            className="w-full border border-twitch-border bg-zinc-900 px-3 py-2.5 text-sm text-zinc-100 outline-none transition-colors focus:border-[#F55376]"
                        />
                    )}
                </div>

                {error && (
                    <p className="border border-red-900/50 bg-red-950/30 px-3 py-2.5 text-xs text-red-400">
                        {error}
                    </p>
                )}

                {success && (
                    <div className="flex items-center gap-2 border border-green-500/20 bg-green-500/10 px-3 py-2.5 text-xs text-green-400">
                        <span className="flex h-4 w-4 items-center justify-center border border-green-500/30 text-[10px]">
                            ✓
                        </span>

                        <span>
                            {t("accountSaved")}
                        </span>
                    </div>
                )}

                <button
                    type="submit"
                    disabled={saving}
                    className="w-full border border-[#F55376] bg-[#F55376] px-4 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:cursor-wait disabled:opacity-60"
                >
                    {saving
                        ? t("loading")
                        : t("saveChanges")}
                </button>
            </form>

            <button
                type="button"
                onClick={handleSignOut}
                className="mt-4 w-full border border-twitch-border px-4 py-2.5 text-sm font-medium text-red-400 transition-colors hover:border-red-400"
            >
                {t("signOut")}
            </button>

            <PlatformConnections />
        </div>
    );
}