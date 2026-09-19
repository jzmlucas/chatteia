"use client";

import { useState } from "react";
import type { PlatformMeta } from "./platformMeta";
import { useLocale, useTranslations } from "next-intl";

type ConnectionInfo =
    | {
    connected: true;
    username: string;
    platformUserId: string;
    connectedAt: string;
}
    | {
    connected: false;
};

interface PlatformCardProps {
    meta: PlatformMeta;
    connection: ConnectionInfo;
    onDisconnect: () => Promise<void>;
}

export function PlatformCard({
                                 meta,
                                 connection,
                                 onDisconnect,
                             }: PlatformCardProps) {
    const locale = useLocale();
    const t = useTranslations("connections");
    const [loading, setLoading] = useState(false);

    const { Icon, name, color, available, connectUrl } = meta;

    async function handleDisconnect() {
        setLoading(true);

        try {
            await onDisconnect();
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="flex items-center gap-4 border border-zinc-800 bg-zinc-900/60 px-4 py-3 transition-colors hover:border-zinc-700">
            {/* Ícone da plataforma */}
            <div
                className="flex h-9 w-9 shrink-0 items-center justify-center"
                style={{
                    backgroundColor: `${color}22`,
                    border: `1px solid ${color}44`,
                    color,
                }}
            >
                <Icon className="h-5 w-5" />
            </div>

            {/* Nome + status */}
            <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                <span className="text-sm font-semibold text-zinc-100">
                    {name}
                </span>

                {connection.connected ? (
                    <span className="truncate text-xs text-zinc-400">
                        @{connection.username}
                    </span>
                ) : !available ? (
                    <span className="text-xs italic text-zinc-600">
                        {t("comingSoon")}
                    </span>
                ) : (
                    <span className="text-xs text-zinc-500">
                        {t("notConnected")}
                    </span>
                )}
            </div>

            {/* Indicador + ação */}
            <div className="flex shrink-0 items-center gap-3">
                {connection.connected && (
                    <>
                        <span className="flex items-center gap-1.5 text-xs font-medium text-emerald-400">
                            <span className="h-1.5 w-1.5 animate-pulse bg-emerald-400" />
                            {t("connectedLabel")}
                        </span>

                        <button
                            onClick={handleDisconnect}
                            disabled={loading}
                            className="text-xs text-zinc-500 transition-colors hover:text-red-400 disabled:opacity-40"
                            title={t("disconnectTitle")}
                        >
                            {loading ? "…" : t("disconnectButtonLabel")}
                        </button>
                    </>
                )}

                {!connection.connected && available && (
                    <a
                        href={`${connectUrl}?locale=${locale}`}
                        className="px-3 py-1.5 text-xs font-semibold transition-colors"
                    >
                        {t("connectButtonLabel")}
                    </a>
                )}
            </div>
        </div>
    );
}