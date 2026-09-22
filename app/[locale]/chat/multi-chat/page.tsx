"use client";

import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

import { MultiChatHeader } from "@/components/chat/MultiChatHeader";
import { MultiChatBoard } from "@/components/chat/layout/MultiChatBoard";
import { Link } from "@/i18n/navigation";
import { useAuth } from "@/contexts/AuthContext";

import { useMultiChatState } from "@/hooks/chat/useMultiChatState";

export default function MultiChatPage() {
    const t = useTranslations("multiChat");
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

    const {
        targets,
        filter,
        setFilter,
        showAdd,
        setShowAdd,
        platform,
        newChannel,
        setNewChannel,
        addError,
        setAddError,
        feedMessages,
        connectedCount,
        generateObsUrl,
        channelPlaceholder,
        addChannel,
        removeTarget,
        handlePlatformChange,
    } = useMultiChatState();

    const gated = isStreamer && isStreamerMode;

    useEffect(() => {
        if (loading) {
            return;
        }

        if (!user) {
            router.replace("/login");
        }
    }, [loading, user, router]);

    // Multi-chat é a feature paga do produto: agrega vários canais de várias
    // plataformas ao mesmo tempo. Sem essa checagem, qualquer pessoa (mesmo
    // deslogada) conseguia usar o recurso completo só sabendo a URL.
    if (loading || !user) {
        return (
            <main className="flex h-dvh items-center justify-center bg-twitch-dark">
                <p className="text-sm text-zinc-500">{tp("loading")}</p>
            </main>
        );
    }

    if (!gated) {
        return (
            <main className="flex h-dvh items-center justify-center bg-twitch-dark px-6">
                <div className="w-full max-w-md border border-twitch-border bg-twitch-panel p-8 text-center">
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
            </main>
        );
    }

    if (billing?.enforced && !hasStreamerAccess) {
        return (
            <main className="flex h-dvh items-center justify-center bg-twitch-dark px-6">
                <div className="w-full max-w-md border border-twitch-border bg-twitch-panel p-8 text-center">
                    <h1 className="text-xl font-bold text-zinc-100">
                        {t("title")}
                    </h1>

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
            </main>
        );
    }

    return (
        <main className="h-dvh flex flex-col overflow-hidden">
            <MultiChatHeader
                targets={targets}
                connectedCount={connectedCount}
                onGenerateObsUrl={generateObsUrl}
                filter={filter}
                onFilterChange={setFilter}
                showAdd={showAdd}
                onToggleShowAdd={() => {
                    setShowAdd((value) => !value);
                    setAddError("");
                }}
                platform={platform}
                onPlatformChange={handlePlatformChange}
                newChannel={newChannel}
                onNewChannelChange={(value) => {
                    setNewChannel(value);

                    if (addError) {
                        setAddError("");
                    }
                }}
                addError={addError}
                channelPlaceholder={channelPlaceholder}
                onAddChannel={addChannel}
                onRemoveTarget={removeTarget}
            />

            <MultiChatBoard 
                targets={targets} 
                feedMessages={feedMessages} 
            />
        </main>
    );
}
