"use client";

import { useEffect, useState } from "react";

import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";

import { Link } from "@/i18n/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { AvatarIcon } from "@/components/layout/AvatarIcon";

type PlatformId =
    | "kick"
    | "twitch"
    | "youtube"
    | "tiktok";

type ConnectionStatus =
    | {
    connected: false;
}
    | {
    connected: true;
    username: string;
    platformUserId: string;
    connectedAt: string;
};

type ConnectionsResponse = Record<
    PlatformId,
    ConnectionStatus
>;

const PLATFORM_META: Record<
    PlatformId,
    {
        name: string;
        shortName: string;
        className: string;
    }
> = {
    twitch: {
        name: "Twitch",
        shortName: "TW",
        className:
            "border-purple-500/30 bg-purple-500/10 text-purple-300",
    },
    kick: {
        name: "Kick",
        shortName: "K",
        className:
            "border-green-500/30 bg-green-500/10 text-green-300",
    },
    youtube: {
        name: "YouTube",
        shortName: "YT",
        className:
            "border-red-500/30 bg-red-500/10 text-red-300",
    },
    tiktok: {
        name: "TikTok",
        shortName: "TT",
        className:
            "border-cyan-500/30 bg-cyan-500/10 text-cyan-300",
    },
};

export default function ProfilePage() {
    const t = useTranslations("auth");
    const tp = useTranslations("profile");

    const router = useRouter();

    const {
        user,
        profile,
        session,
        loading,
        isStreamer,
        isStreamerMode,
        activeMode,
    } = useAuth();

    const [connections, setConnections] =
        useState<ConnectionsResponse | null>(null);

    const [connectionsLoading, setConnectionsLoading] =
        useState(true);

    const [connectionsError, setConnectionsError] =
        useState(false);

    useEffect(() => {
        if (loading) {
            return;
        }

        if (!user) {
            router.replace("/login");
            return;
        }

        if (!isStreamer || !isStreamerMode) {
            setConnectionsLoading(false);
            return;
        }

        if (!session?.access_token) {
            setConnectionsLoading(false);
            return;
        }

        const accessToken = session.access_token;

        let active = true;

        async function loadConnections() {
            try {
                const response = await fetch(
                    "/api/platforms/connections",
                    {
                        credentials: "include",
                        headers: {
                            Authorization: `Bearer ${accessToken}`,
                        },
                    }
                );

                if (!response.ok) {
                    throw new Error(
                        "Falha ao carregar conexões."
                    );
                }

                const data =
                    (await response.json()) as ConnectionsResponse;

                if (!active) {
                    return;
                }

                setConnections(data);
                setConnectionsError(false);
            } catch {
                if (!active) {
                    return;
                }

                setConnectionsError(true);
            } finally {
                if (active) {
                    setConnectionsLoading(false);
                }
            }
        }

        setConnectionsLoading(true);
        loadConnections();

        return () => {
            active = false;
        };
    }, [
        loading,
        user,
        session?.access_token,
        isStreamer,
        isStreamerMode,
        router,
    ]);

    if (loading || !user) {
        return (
            <main className="min-h-screen bg-twitch-dark">
                <div className="mx-auto flex min-h-screen w-full max-w-6xl items-center justify-center px-6">
                    <p className="text-sm text-zinc-500">
                        {t("loading")}
                    </p>
                </div>
            </main>
        );
    }

    if (!isStreamer || !isStreamerMode) {
        return (
            <main className="min-h-screen bg-twitch-dark">
                <div className="mx-auto flex min-h-screen w-full max-w-3xl items-center justify-center px-6">
                    <div className="w-full border border-twitch-border bg-twitch-panel p-8 text-center">
                        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center border border-[#F55376]/30 bg-[#F55376]/10 text-sm font-bold text-[#F55376]">
                            ST
                        </div>

                        <h1 className="text-xl font-bold text-zinc-100">
                            {tp("streamerModeTitle")}
                        </h1>

                        <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-zinc-500">
                            {tp("streamerModeHint")}
                        </p>

                        <Link
                            href="/account"
                            className="mt-6 inline-flex border border-twitch-border px-4 py-2.5 text-sm font-medium text-zinc-300 transition-colors hover:border-[#F55376] hover:text-white"
                        >
                            {tp("myAccountLink")}
                        </Link>
                    </div>
                </div>
            </main>
        );
    }

    const connectedPlatforms = (
        Object.entries(
            connections ?? {}
        ) as [
            PlatformId,
            ConnectionStatus
        ][]
    ).filter(
        ([, connection]) =>
            connection.connected
    );

    const twitchConnection =
        connections?.twitch;

    const twitchChannel =
        twitchConnection?.connected
            ? twitchConnection.username
            : null;

    return (
        <main className="min-h-screen bg-twitch-dark">
            <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
                <div className="mb-8">
                    <Link
                        href="/account"
                        className="text-xs text-zinc-500 transition-colors hover:text-zinc-300"
                    >
                        {tp("backToAccount")}
                    </Link>

                    <div className="mt-5 flex flex-col gap-5 border border-twitch-border bg-twitch-panel p-6 sm:flex-row sm:items-center">
                        <AvatarIcon
                            avatarUrl={profile?.avatar_url}
                            label={
                                profile?.display_name ||
                                profile?.username ||
                                "Streamer"
                            }
                            size={72}
                        />

                        <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                                <h1 className="text-2xl font-bold text-zinc-100">
                                    {profile?.display_name ||
                                        profile?.username}
                                </h1>

                                <span className="bg-[#F55376]/15 px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-[#F55376]">
                                    {activeMode === "streamer"
                                        ? tp("roleStreamer")
                                        : tp("roleUser")}
                                </span>
                            </div>

                            <p className="mt-1 text-sm text-zinc-500">
                                @{profile?.username}
                            </p>

                            {profile?.bio && (
                                <p className="mt-3 max-w-2xl text-sm leading-6 text-zinc-400">
                                    {profile.bio}
                                </p>
                            )}
                        </div>

                        <Link
                            href="/account"
                            className="border border-twitch-border px-4 py-2.5 text-sm font-medium text-zinc-300 transition-colors hover:border-zinc-600 hover:text-white"
                        >
                            {tp("editProfileButton")}
                        </Link>
                    </div>
                </div>

                <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
                    <section>
                        <div className="mb-4">
                            <h2 className="text-lg font-bold text-zinc-100">
                                {tp("hubTitle")}
                            </h2>

                            <p className="mt-1 text-sm text-zinc-500">
                                {tp("hubSubtitle")}
                            </p>
                        </div>

                        <div className="grid gap-3 sm:grid-cols-2">
                            <Link
                                href="/chat/multi-chat"
                                className="group border border-twitch-border bg-twitch-panel p-5 transition-colors hover:border-[#F55376]/50"
                            >
                                <div className="mb-4 flex h-10 w-10 items-center justify-center border border-[#F55376]/30 bg-[#F55376]/10 text-sm font-bold text-[#F55376]">
                                    CHAT
                                </div>

                                <h3 className="text-sm font-semibold text-zinc-100">
                                    {tp("multiChatCardTitle")}
                                </h3>

                                <p className="mt-1 text-xs leading-5 text-zinc-500">
                                    {tp("multiChatCardDesc")}
                                </p>

                                <span className="mt-4 block text-xs font-medium text-zinc-400 transition-colors group-hover:text-[#F55376]">
                                    {tp("openChatLink")}
                                </span>
                            </Link>

                            {twitchChannel ? (
                                <Link
                                    href={`/obs/${encodeURIComponent(
                                        twitchChannel
                                    )}`}
                                    className="group border border-twitch-border bg-twitch-panel p-5 transition-colors hover:border-[#F55376]/50"
                                >
                                    <div className="mb-4 flex h-10 w-10 items-center justify-center border border-purple-500/30 bg-purple-500/10 text-xs font-bold text-purple-300">
                                        OBS
                                    </div>

                                    <h3 className="text-sm font-semibold text-zinc-100">
                                        {tp("obsCardTitle")}
                                    </h3>

                                    <p className="mt-1 text-xs leading-5 text-zinc-500">
                                        {tp("obsCardDescConnected")}
                                    </p>

                                    <span className="mt-4 block text-xs font-medium text-zinc-400 transition-colors group-hover:text-[#F55376]">
                                        {tp("openOverlayLink")}
                                    </span>
                                </Link>
                            ) : (
                                <div className="border border-twitch-border bg-twitch-panel p-5 opacity-60">
                                    <div className="mb-4 flex h-10 w-10 items-center justify-center border border-purple-500/30 bg-purple-500/10 text-xs font-bold text-purple-300">
                                        OBS
                                    </div>

                                    <h3 className="text-sm font-semibold text-zinc-100">
                                        {tp("obsCardTitle")}
                                    </h3>

                                    <p className="mt-1 text-xs leading-5 text-zinc-500">
                                        {tp("obsCardDescDisconnected")}
                                    </p>
                                </div>
                            )}

                            <div className="border border-dashed border-twitch-border bg-twitch-panel p-5 opacity-70">
                                <div className="mb-4 flex h-10 w-10 items-center justify-center border border-yellow-500/30 bg-yellow-500/10 text-xs font-bold text-yellow-300">
                                    🎁
                                </div>

                                <h3 className="text-sm font-semibold text-zinc-100">
                                    {tp("giveawaysCardTitle")}
                                </h3>

                                <p className="mt-1 text-xs leading-5 text-zinc-500">
                                    {tp("giveawaysCardDesc")}
                                </p>

                                <span className="mt-4 block text-xs text-zinc-600">
                                    {tp("comingSoon")}
                                </span>
                            </div>

                            <div className="border border-dashed border-twitch-border bg-twitch-panel p-5 opacity-70">
                                <div className="mb-4 flex h-10 w-10 items-center justify-center border border-red-500/30 bg-red-500/10 text-xs font-bold text-red-300">
                                    MOD
                                </div>

                                <h3 className="text-sm font-semibold text-zinc-100">
                                    {tp("moderationCardTitle")}
                                </h3>

                                <p className="mt-1 text-xs leading-5 text-zinc-500">
                                    {tp("moderationCardDesc")}
                                </p>

                                <span className="mt-4 block text-xs text-zinc-600">
                                    {tp("comingSoon")}
                                </span>
                            </div>
                        </div>
                    </section>

                    <aside className="lg:pt-[60px]">
                        <div className="border border-twitch-border bg-twitch-panel p-5">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h2 className="text-sm font-semibold text-zinc-100">
                                        {tp("platformsTitle")}
                                    </h2>

                                    <p className="mt-1 text-xs text-zinc-500">
                                        {tp("platformsSubtitle")}
                                    </p>
                                </div>

                                <Link
                                    href="/account"
                                    className="text-xs text-zinc-500 transition-colors hover:text-[#F55376]"
                                >
                                    {tp("manageLink")}
                                </Link>
                            </div>

                            <div className="mt-5 flex flex-col gap-2">
                                {connectionsLoading ? (
                                    <>
                                        {(
                                            Object.keys(
                                                PLATFORM_META
                                            ) as PlatformId[]
                                        ).map(
                                            (platform) => (
                                                <div
                                                    key={platform}
                                                    className="h-14 animate-pulse border border-twitch-border bg-zinc-900/40"
                                                />
                                            )
                                        )}
                                    </>
                                ) : connectionsError ? (
                                    <p className="border border-red-900/50 bg-red-950/30 px-3 py-3 text-xs text-red-400">
                                        {tp("connectionsLoadError")}
                                    </p>
                                ) : (
                                    (
                                        Object.keys(
                                            PLATFORM_META
                                        ) as PlatformId[]
                                    ).map(
                                        (platform) => {
                                            const meta =
                                                PLATFORM_META[
                                                    platform
                                                    ];

                                            const connection =
                                                connections?.[
                                                    platform
                                                    ];

                                            const connected =
                                                connection?.connected ===
                                                true;

                                            return (
                                                <div
                                                    key={
                                                        platform
                                                    }
                                                    className="flex items-center gap-3 border border-twitch-border px-3 py-3"
                                                >
                                                    <div
                                                        className={`flex h-9 w-9 shrink-0 items-center justify-center border text-[10px] font-bold ${meta.className}`}
                                                    >
                                                        {
                                                            meta.shortName
                                                        }
                                                    </div>

                                                    <div className="min-w-0 flex-1">
                                                        <p className="text-xs font-medium text-zinc-200">
                                                            {
                                                                meta.name
                                                            }
                                                        </p>

                                                        <p className="truncate text-[11px] text-zinc-500">
                                                            {connected
                                                                ? connection.username
                                                                : tp("notConnectedShort")}
                                                        </p>
                                                    </div>

                                                    <span
                                                        className={`h-2 w-2 shrink-0 ${
                                                            connected
                                                                ? "bg-green-400"
                                                                : "bg-zinc-700"
                                                        }`}
                                                    />
                                                </div>
                                            );
                                        }
                                    )
                                )}
                            </div>

                            {!connectionsLoading &&
                                !connectionsError && (
                                    <div className="mt-4 border-t border-twitch-border pt-4">
                                        <p className="text-xs text-zinc-500">
                                            {tp("platformsConnectedCount", {
                                                count: connectedPlatforms.length,
                                            })}
                                        </p>
                                    </div>
                                )}
                        </div>
                    </aside>
                </div>

                <div className="mt-6 border border-twitch-border bg-twitch-panel p-5">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <h2 className="text-sm font-semibold text-zinc-100">
                                {tp("identityTitle")}
                            </h2>

                            <p className="mt-1 text-xs leading-5 text-zinc-500">
                                {tp("identityDesc")}
                            </p>
                        </div>

                        <div className="flex items-center gap-2 text-xs text-zinc-500">
                            <span className="h-2 w-2 bg-green-400" />
                            {tp("identityModeActive")}
                        </div>
                    </div>
                </div>
            </div>
        </main>
    );
}