"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";

import { useAuth } from "@/contexts/AuthContext";
import { useAccountForm } from "@/hooks/auth/useAccountForm";
import { MaskedEmail } from "@/components/layout/MaskedEmail";
import { PlatformConnections } from "@/components/account/PlatformConnections";

export function AccountPanel() {
    const t = useTranslations("auth");

    const { user, profile, signOut } = useAuth();

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

    const [showAvatarUrl, setShowAvatarUrl] = useState(false);

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

                <div>
                    <h1 className="text-lg font-bold text-zinc-100">
                        {profile?.display_name ||
                            profile?.username}
                    </h1>

                    <p className="text-sm text-zinc-400">
                        @{profile?.username}
                    </p>

                    <span className="mt-1 inline-block bg-[#F55376]/20 px-2 py-0.5 text-[11px] text-[#F55376]">
                        {profile?.account_type === "streamer"
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
                <div className="flex flex-col gap-1.5">
                    <label
                        htmlFor="displayName"
                        className="text-xs font-medium text-zinc-400"
                    >
                        {t("displayNameLabel")}
                    </label>

                    <input
                        id="displayName"
                        type="text"
                        value={displayName}
                        onChange={(event) =>
                            setDisplayName(event.target.value)
                        }
                        className="border border-twitch-border bg-twitch-dark px-3 py-2.5 text-sm text-zinc-100 outline-none focus-visible:border-[#F55376]"
                    />
                </div>

                <div className="flex flex-col gap-1.5">
                    <div className="flex items-center justify-between">
                        <label
                            htmlFor="avatarUrl"
                            className="text-xs font-medium text-zinc-400"
                        >
                            {t("avatarUrlLabel")}
                        </label>

                        <button
                            type="button"
                            onClick={() =>
                                setShowAvatarUrl((current) => !current)
                            }
                            className="text-xs text-zinc-500 transition-colors hover:text-[#F55376]"
                        >
                            {showAvatarUrl ? "Ocultar" : "Exibir"}
                        </button>
                    </div>

                    <input
                        id="avatarUrl"
                        type={showAvatarUrl ? "url" : "password"}
                        value={avatarUrl}
                        onChange={(event) =>
                            setAvatarUrl(event.target.value)
                        }
                        placeholder="https://..."
                        className="border border-twitch-border bg-twitch-dark px-3 py-2.5 text-sm text-zinc-100 outline-none focus-visible:border-[#F55376]"
                    />
                </div>

                <div className="flex flex-col gap-1.5">
                    <label
                        htmlFor="bio"
                        className="text-xs font-medium text-zinc-400"
                    >
                        {t("bioLabel")}
                    </label>

                    <textarea
                        id="bio"
                        value={bio}
                        onChange={(event) =>
                            setBio(event.target.value)
                        }
                        rows={3}
                        className="resize-none border border-twitch-border bg-twitch-dark px-3 py-2.5 text-sm text-zinc-100 outline-none focus-visible:border-[#F55376]"
                    />
                </div>

                {error && (
                    <p className="bg-red-950/50 px-3 py-2 text-sm text-red-400">
                        {error}
                    </p>
                )}

                {success && (
                    <p className="bg-green-950/50 px-3 py-2 text-sm text-green-400">
                        {t("accountSaved")}
                    </p>
                )}

                <button
                    type="submit"
                    disabled={saving}
                    className="bg-[#F55376] px-4 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
                >
                    {saving ? t("loading") : t("saveChanges")}
                </button>
            </form>

            <button
                type="button"
                onClick={() => signOut()}
                className="mt-4 w-full border border-twitch-border px-4 py-2.5 text-sm font-medium text-red-400 hover:border-red-400"
            >
                {t("signOut")}
            </button>

            <PlatformConnections />
        </div>
    );
}