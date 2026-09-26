"use client";

import { useEffect, useState } from "react";

import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";

import { HomeLogoLink } from "@/components/layout/HomeLogoLink";
import { useAuth } from "@/contexts/AuthContext";
import { Link } from "@/i18n/navigation";
import type { ChatPlatform } from "@/lib/chat/types";
import { CHAT_PLATFORMS, type GiveawayChannel, type GiveawaySummary } from "@/types/giveaway";

const PLATFORM_LABEL: Record<ChatPlatform, string> = {
    twitch: "Twitch",
    kick: "Kick",
    youtube: "YouTube",
    tiktok: "TikTok",
};

type LoadState = {
    giveaway: GiveawaySummary | null;
    maxChannels: number;
};

export default function GiveawaysPage() {
    const t = useTranslations("giveaways");
    const tp = useTranslations("profile");
    const tBilling = useTranslations("billing");

    const router = useRouter();

    const {
        user,
        loading,
        isStreamer,
        isStreamerMode,
        hasStreamerAccess,
        billing,
    } = useAuth();

    const [state, setState] = useState<LoadState | null>(null);
    const [fetchError, setFetchError] = useState(false);

    const [trigger, setTrigger] = useState("!sorteio");
    const [durationEnabled, setDurationEnabled] = useState(false);
    const [durationMinutes, setDurationMinutes] = useState(10);
    const [winnerCount, setWinnerCount] = useState(1);
    const [channels, setChannels] = useState<GiveawayChannel[]>([]);
    const [newPlatform, setNewPlatform] = useState<ChatPlatform>("twitch");
    const [newChannelName, setNewChannelName] = useState("");

    const [saving, setSaving] = useState(false);
    const [toggling, setToggling] = useState(false);
    const [drawing, setDrawing] = useState(false);
    const [errorCode, setErrorCode] = useState<string | null>(null);
    const [savedAt, setSavedAt] = useState<number | null>(null);

    const gated = isStreamer && isStreamerMode;

    useEffect(() => {
        if (loading) {
            return;
        }

        if (!user) {
            router.replace("/login");
            return;
        }

        if (!gated) {
            return;
        }

        let active = true;

        fetch("/api/giveaways", { credentials: "include" })
            .then((response) => {
                if (!response.ok) {
                    throw new Error("giveaway");
                }

                return response.json() as Promise<LoadState>;
            })
            .then((data) => {
                if (!active) {
                    return;
                }

                setState(data);

                if (data.giveaway) {
                    setTrigger(data.giveaway.trigger);
                    setChannels(data.giveaway.channels);
                    setDurationEnabled(data.giveaway.durationSeconds !== null);
                    setDurationMinutes(Math.max(1, Math.round((data.giveaway.durationSeconds ?? 600) / 60)));
                    setWinnerCount(data.giveaway.winnerCount ?? 1);
                }
            })
            .catch(() => {
                if (active) {
                    setFetchError(true);
                }
            });

        return () => {
            active = false;
        };
    }, [loading, user, gated, router]);

    const maxChannels = state?.maxChannels ?? 4;
    const giveaway = state?.giveaway ?? null;
    const isOpen = giveaway?.status === "open";

    useEffect(() => {
        if (!isOpen || !gated) {
            return;
        }

        const refresh = () => {
            void fetch("/api/giveaways", { credentials: "include" })
                .then((response) => response.json() as Promise<LoadState>)
                .then((data) => setState(data))
                .catch(() => undefined);
        };

        const timer = window.setInterval(refresh, 5000);
        return () => window.clearInterval(timer);
    }, [gated, isOpen]);

    function addChannel() {
        const name = newChannelName.trim();

        if (!name) {
            return;
        }

        const key = `${newPlatform}:${name.toLowerCase()}`;

        if (channels.some((c) => `${c.platform}:${c.channelName.toLowerCase()}` === key)) {
            setErrorCode("DUPLICATE_CHANNEL");
            return;
        }

        if (channels.length >= maxChannels) {
            setErrorCode("TOO_MANY_CHANNELS");
            return;
        }

        setErrorCode(null);
        setChannels((current) => [...current, { platform: newPlatform, channelName: name }]);
        setNewChannelName("");
    }

    function removeChannel(index: number) {
        setChannels((current) => current.filter((_, i) => i !== index));
    }

    async function handleSave() {
        setSaving(true);
        setErrorCode(null);
        setSavedAt(null);

        try {
            const response = await fetch("/api/giveaways", {
                method: "PUT",
                credentials: "include",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    trigger,
                    channels,
                    durationSeconds: durationEnabled ? durationMinutes * 60 : null,
                    winnerCount,
                }),
            });

            const data = (await response.json().catch(() => ({}))) as {
                giveaway?: GiveawaySummary;
                maxChannels?: number;
                error?: string;
            };

            if (!response.ok) {
                setErrorCode(data.error ?? "GENERIC");
                return;
            }

                    setState({
                giveaway: data.giveaway ?? null,
                maxChannels: data.maxChannels ?? maxChannels,
                    });
            setSavedAt(Date.now());
        } catch {
            setErrorCode("GENERIC");
        } finally {
            setSaving(false);
        }
    }

    async function handleToggleStatus() {
        setToggling(true);
        setErrorCode(null);

        try {
            const response = await fetch("/api/giveaways/status", {
                method: "PATCH",
                credentials: "include",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ status: isOpen ? "closed" : "open" }),
            });

            const data = (await response.json().catch(() => ({}))) as {
                giveaway?: GiveawaySummary;
                error?: string;
            };

            if (!response.ok) {
                setErrorCode(data.error ?? "GENERIC");
                return;
            }

            setState((current) =>
                current ? { ...current, giveaway: data.giveaway ?? null } : current
            );
        } catch {
            setErrorCode("GENERIC");
        } finally {
            setToggling(false);
        }
    }

    async function handleDraw() {
        setDrawing(true);
        setErrorCode(null);

        try {
            const response = await fetch("/api/giveaways/status", {
                method: "PATCH",
                credentials: "include",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ action: "draw" }),
            });
            const data = (await response.json().catch(() => ({}))) as {
                giveaway?: GiveawaySummary;
                error?: string;
            };

            if (!response.ok) {
                setErrorCode(data.error ?? "GENERIC");
                return;
            }

            setState((current) => current ? { ...current, giveaway: data.giveaway ?? null } : current);
        } catch {
            setErrorCode("GENERIC");
        } finally {
            setDrawing(false);
        }
    }

    if (loading || !user) {
        return (
            <main className="min-h-screen bg-twitch-dark">
                <div className="mx-auto flex min-h-screen w-full max-w-3xl items-center justify-center px-6">
                    <p className="text-sm text-zinc-500">{tp("loading")}</p>
                </div>
            </main>
        );
    }

    if (!gated) {
        return (
            <main className="min-h-screen bg-twitch-dark">
                <div className="mx-auto flex min-h-screen w-full max-w-3xl items-center justify-center px-6">
                    <div className="w-full border border-twitch-border bg-twitch-panel p-8 text-center">
                        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center border border-[#F55376]/30 bg-[#F55376]/10 text-sm font-bold text-[#F55376]">
                            🎁
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

    // Modo streamer ativo, mas sem direito de uso (billing ligado e sem
    // assinatura viva) — mesmo gate visual da hub em /profile.
    if (billing?.enforced && !hasStreamerAccess) {
        return (
            <main className="min-h-screen bg-twitch-dark">
                <div className="mx-auto flex min-h-screen w-full max-w-3xl items-center justify-center px-6">
                    <div className="w-full border border-twitch-border bg-twitch-panel p-8 text-center">
                        <h1 className="text-xl font-bold text-zinc-100">{t("title")}</h1>

                        <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-zinc-400">
                            {tBilling("gateHint")}
                        </p>

                        <Link
                            href="/billing"
                            className="mt-6 inline-flex border border-[#F55376] bg-[#F55376] px-4 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
                        >
                            {tBilling("gateCta")}
                        </Link>
                    </div>
                </div>
            </main>
        );
    }

    return (
        <main className="min-h-screen bg-twitch-dark">
            <div className="mx-auto w-full max-w-3xl px-4 py-8 sm:px-6">
                <HomeLogoLink />

                <div className="mb-6 mt-5">
                    <Link
                        href="/profile"
                        className="text-xs text-zinc-500 transition-colors hover:text-zinc-300"
                    >
                        {t("backToHub")}
                    </Link>

                    <h1 className="mt-2 text-xl font-bold text-zinc-100">{t("title")}</h1>
                    <p className="mt-1 text-sm text-zinc-500">{t("subtitle")}</p>
                </div>

                {fetchError && (
                    <p className="mb-4 border border-red-900/50 bg-red-950/30 px-4 py-3 text-xs text-red-400">
                        {t("loadError")}
                    </p>
                )}

                {errorCode && (
                    <p
                        role="alert"
                        className="mb-4 border border-red-900/50 bg-red-950/30 px-4 py-3 text-xs text-red-400"
                    >
                        {t.has(`error.${errorCode}`) ? t(`error.${errorCode}`) : t("error.GENERIC")}
                    </p>
                )}

                <section className="mb-5 grid gap-3 sm:grid-cols-3">
                    <div className="border border-twitch-border bg-twitch-panel p-4">
                        <p className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500">{t("status.open")}</p>
                        <p className={`mt-2 text-lg font-semibold ${isOpen ? "text-emerald-300" : "text-zinc-300"}`}>
                            {isOpen ? t("liveStatus") : t(`status.${giveaway?.status ?? "draft"}`)}
                        </p>
                        <p className="mt-1 text-xs text-zinc-500">
                            {isOpen ? t("entrySourceHint") : t("waitingStatus")}
                        </p>
                    </div>
                    <div className="border border-twitch-border bg-twitch-panel p-4">
                        <p className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500">{t("participantsLabel")}</p>
                        <p className="mt-2 text-3xl font-semibold text-zinc-100">{giveaway?.participants.length ?? 0}</p>
                        <p className="mt-1 text-xs text-zinc-500">{t("participantsCount", { count: giveaway?.participants.length ?? 0 })}</p>
                    </div>
                    <div className="border border-twitch-border bg-twitch-panel p-4">
                        <p className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500">{t("triggerLabel")}</p>
                        <p className="mt-2 truncate text-lg font-semibold text-[#F55376]">{trigger || "—"}</p>
                        <p className="mt-1 truncate text-xs text-zinc-500">
                            {t("triggerPreview", { trigger: trigger || "—", plainTrigger: trigger.replace(/^!+/, "") || "—" })}
                        </p>
                    </div>
                </section>

                <section className="border border-twitch-border bg-twitch-panel p-6">
                    <div className="flex items-center justify-between gap-3">
                        <label htmlFor="trigger" className="text-sm font-semibold text-zinc-100">
                            {t("triggerLabel")}
                        </label>

                        {giveaway && (
                            <span
                                className={`px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide ${
                                    isOpen
                                        ? "bg-emerald-500/15 text-emerald-300"
                                        : "bg-zinc-700/40 text-zinc-400"
                                }`}
                            >
                                {t(`status.${giveaway.status}`)}
                            </span>
                        )}
                    </div>

                    <p className="mt-1 text-xs text-zinc-500">{t("triggerHint")}</p>

                    <input
                        id="trigger"
                        value={trigger}
                        onChange={(event) => setTrigger(event.target.value)}
                        placeholder="!sorteio"
                        maxLength={32}
                        className="mt-3 w-full border border-zinc-700 bg-zinc-900 px-3 py-2.5 text-sm text-zinc-100 outline-none focus:border-[#F55376]"
                    />

                    <div className="mt-4 border border-zinc-800 bg-zinc-900/50 p-4">
                        <label className="flex items-center gap-3 text-sm text-zinc-200">
                            <input
                                type="checkbox"
                                checked={durationEnabled}
                                onChange={(event) => setDurationEnabled(event.target.checked)}
                                className="h-4 w-4 accent-[#F55376]"
                            />
                            {t("timerLabel")}
                        </label>

                        {durationEnabled && (
                            <div className="mt-3 flex items-center gap-2 text-sm text-zinc-400">
                                <input
                                    type="number"
                                    min={1}
                                    max={1440}
                                    value={durationMinutes}
                                    onChange={(event) => setDurationMinutes(Math.min(1440, Math.max(1, Number(event.target.value) || 1)))}
                                    className="w-24 border border-zinc-700 bg-zinc-900 px-3 py-2 text-zinc-100 outline-none focus:border-[#F55376]"
                                />
                                {t("minutes")}
                            </div>
                        )}
                    </div>

                    <div className="mt-4 border border-zinc-800 bg-zinc-900/50 p-4">
                        <label htmlFor="winner-count" className="text-sm font-medium text-zinc-200">
                            {t("winnerCountLabel")}
                        </label>
                        <p className="mt-1 text-xs text-zinc-500">{t("winnerCountHint")}</p>
                        <input
                            id="winner-count"
                            type="number"
                            min={1}
                            max={50}
                            value={winnerCount}
                            onChange={(event) => setWinnerCount(Math.min(50, Math.max(1, Number(event.target.value) || 1)))}
                            className="mt-3 w-24 border border-zinc-700 bg-zinc-900 px-3 py-2 text-zinc-100 outline-none focus:border-[#F55376]"
                        />
                    </div>

                    <div className="mt-6 border-t border-twitch-border pt-6">
                        <h2 className="text-sm font-semibold text-zinc-100">
                            {t("channelsLabel")}
                        </h2>

                        <p className="mt-1 text-xs leading-5 text-zinc-500">
                            {t("channelsHint", { max: maxChannels })}
                        </p>

                        <ul className="mt-4 space-y-2">
                            {channels.map((channel, index) => (
                                <li
                                    key={`${channel.platform}:${channel.channelName}`}
                                    className="flex items-center justify-between gap-3 border border-zinc-800 bg-zinc-900/60 px-3 py-2"
                                >
                                    <div className="flex items-center gap-2 text-sm text-zinc-200">
                                        <span className="border border-twitch-border px-1.5 py-0.5 text-[10px] font-semibold uppercase text-zinc-400">
                                            {PLATFORM_LABEL[channel.platform]}
                                        </span>
                                        {channel.channelName}
                                    </div>

                                    <button
                                        type="button"
                                        onClick={() => removeChannel(index)}
                                        className="text-xs text-zinc-500 transition-colors hover:text-red-400"
                                    >
                                        {t("removeChannel")}
                                    </button>
                                </li>
                            ))}

                            {channels.length === 0 && (
                                <li className="border border-dashed border-twitch-border px-3 py-3 text-xs text-zinc-600">
                                    {t("noChannels")}
                                </li>
                            )}
                        </ul>

                        {channels.length < maxChannels && (
                            <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                                <select
                                    value={newPlatform}
                                    onChange={(event) =>
                                        setNewPlatform(event.target.value as ChatPlatform)
                                    }
                                    className="border border-zinc-700 bg-zinc-900 px-3 py-2.5 text-sm text-zinc-100 outline-none focus:border-[#F55376]"
                                >
                                    {CHAT_PLATFORMS.map((platform) => (
                                        <option key={platform} value={platform}>
                                            {PLATFORM_LABEL[platform]}
                                        </option>
                                    ))}
                                </select>

                                <input
                                    value={newChannelName}
                                    onChange={(event) => setNewChannelName(event.target.value)}
                                    onKeyDown={(event) => {
                                        if (event.key === "Enter") {
                                            event.preventDefault();
                                            addChannel();
                                        }
                                    }}
                                    placeholder={t("channelNamePlaceholder")}
                                    maxLength={64}
                                    className="flex-1 border border-zinc-700 bg-zinc-900 px-3 py-2.5 text-sm text-zinc-100 outline-none focus:border-[#F55376]"
                                />

                                <button
                                    type="button"
                                    onClick={addChannel}
                                    className="border border-twitch-border px-4 py-2.5 text-sm font-medium text-zinc-300 transition-colors hover:border-[#F55376] hover:text-white"
                                >
                                    {t("addChannel")}
                                </button>
                            </div>
                        )}
                    </div>

                    <div className="mt-6 flex flex-col gap-3 border-t border-twitch-border pt-6 sm:flex-row">
                        <button
                            type="button"
                            onClick={handleSave}
                            disabled={saving || channels.length === 0 || !trigger.trim()}
                            className="flex-1 border border-[#F55376] bg-[#F55376] px-4 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            {saving ? t("saving") : t("save")}
                        </button>

                        {giveaway && (
                            <button
                                type="button"
                                onClick={handleToggleStatus}
                                disabled={toggling}
                                className="flex-1 border border-twitch-border px-4 py-2.5 text-sm font-medium text-zinc-300 transition-colors hover:border-zinc-500 hover:text-white disabled:cursor-wait disabled:opacity-60"
                            >
                                {toggling
                                    ? t("updatingStatus")
                                    : isOpen
                                      ? t("closeGiveaway")
                                      : t("openGiveaway")}
                            </button>
                        )}

                        {giveaway && giveaway.participants.length > 0 && (
                            <button
                                type="button"
                                onClick={handleDraw}
                                disabled={drawing || giveaway.status === "open"}
                                className="flex-1 border border-amber-500/60 bg-amber-500/10 px-4 py-2.5 text-sm font-semibold text-amber-200 transition-colors hover:bg-amber-500/20 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                {drawing ? t("drawing") : t("drawWinners")}
                            </button>
                        )}
                    </div>

                    {savedAt && (
                        <p className="mt-3 text-center text-xs text-emerald-400">{t("saved")}</p>
                    )}

                    {giveaway && (
                        <div className="mt-6 border-t border-twitch-border pt-6">
                            <div className="flex items-center justify-between gap-3">
                                <h2 className="text-sm font-semibold text-zinc-100">
                                    {t("participantsLabel")}
                                </h2>
                                <span className="text-xs text-zinc-500">
                                    {t("participantsCount", { count: giveaway.participants.length })}
                                </span>
                            </div>

                            {giveaway.deadlineAt && isOpen && (
                                <p className="mt-1 text-xs text-amber-300">
                                    {t("timerActive", { date: new Date(giveaway.deadlineAt).toLocaleTimeString() })}
                                </p>
                            )}

                            <div className="mt-3 grid max-h-72 gap-2 overflow-y-auto pr-1 sm:grid-cols-2">
                                {giveaway.participants.map((participant) => (
                                    <span
                                        key={`${participant.platform}:${participant.username}`}
                                        className="flex items-center justify-between gap-3 border border-zinc-700 bg-zinc-900 px-3 py-2 text-xs text-zinc-200"
                                        title={`${participant.displayName} · ${participant.platform}`}
                                    >
                                        <span className="truncate font-medium">{participant.displayName}</span>
                                        <span className="shrink-0 text-[10px] uppercase text-zinc-500">{participant.platform}</span>
                                    </span>
                                ))}
                            </div>

                            {giveaway.participants.length === 0 && (
                                <p className="mt-3 text-xs text-zinc-600">{t("noParticipants")}</p>
                            )}

                            {giveaway.winners.length > 0 && (
                                <div className="mt-5 border-t border-amber-500/20 pt-4">
                                    <h3 className="text-sm font-semibold text-amber-200">{t("winnersLabel")}</h3>
                                    <div className="mt-3 grid gap-2 sm:grid-cols-2">
                                        {giveaway.winners.map((winner, index) => (
                                            <div key={`${winner.platform}:${winner.username}`} className="border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-sm text-amber-100">
                                                <span className="mr-2 text-xs text-amber-300">#{index + 1}</span>
                                                {winner.displayName ?? winner.username}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </section>
            </div>
        </main>
    );
}
