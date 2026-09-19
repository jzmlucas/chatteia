"use client";

import {
    useCallback,
    useEffect,
    useRef,
    useState,
} from "react";

import { useTranslations } from "next-intl";

import { PlatformCard } from "./PlatformCard";
import { PLATFORM_META } from "./platformMeta";
import { useAuth } from "@/contexts/AuthContext";

type ConnectionStatus =
    | {
    connected: true;
    username: string;
    platformUserId: string;
    connectedAt: string;
}
    | {
    connected: false;
};

type ConnectionsMap = Record<string, ConnectionStatus>;

export function PlatformConnections() {
    const { session } = useAuth();
    const t = useTranslations("connections");

    const [connections, setConnections] =
        useState<ConnectionsMap | null>(null);

    const [error, setError] = useState(false);
    const [isOpen, setIsOpen] = useState(false);

    const containerRef = useRef<HTMLDivElement>(null);

    const fetchConnections = useCallback(async () => {
        if (!session?.access_token) {
            return;
        }

        try {
            const res = await fetch("/api/platforms/connections", {
                credentials: "include",
                headers: {
                    Authorization: `Bearer ${session.access_token}`,
                },
            });

            if (!res.ok) {
                setError(true);
                return;
            }

            const data = await res.json();

            setConnections(data);
            setError(false);
        } catch {
            setError(true);
        }
    }, [session?.access_token]);

    useEffect(() => {
        fetchConnections();
    }, [fetchConnections]);

    function handleToggle() {
        const willOpen = !isOpen;

        setIsOpen(willOpen);

        if (willOpen) {
            requestAnimationFrame(() => {
                containerRef.current?.scrollIntoView({
                    behavior: "smooth",
                    block: "start",
                });
            });
        }
    }

    async function handleDisconnect(platform: string) {
        if (platform !== "kick") return;
        if (!session?.access_token) return;

        try {
            await fetch(
                `/api/platforms/connections/${platform}/disconnect`,
                {
                    method: "POST",
                    credentials: "include",
                    headers: {
                        Authorization: `Bearer ${session.access_token}`,
                    },
                }
            );

            await fetchConnections();
        } catch {
            // Silencia — o usuário pode tentar novamente.
        }
    }

    return (
        <div
            ref={containerRef}
            className="mt-8 border-t border-zinc-800 pt-6"
        >
            <button
                type="button"
                onClick={handleToggle}
                className="flex w-full items-center justify-between text-left"
                aria-expanded={isOpen}
            >
                <div>
                    <h2 className="text-sm font-semibold text-zinc-100">
                        {t("title")}
                    </h2>

                    <p className="mt-1 text-xs text-zinc-500">
                        {t("subtitle")}
                    </p>
                </div>

                <span
                    className={`ml-4 shrink-0 text-zinc-500 transition-transform duration-200 ${
                        isOpen ? "rotate-180" : ""
                    }`}
                    aria-hidden="true"
                >
                    ▼
                </span>
            </button>

            {isOpen && (
                <div className="mt-4">
                    {error && (
                        <p className="mb-3 border border-red-900/50 bg-red-950/30 px-3 py-2 text-xs text-red-400">
                            {t("loadError")}
                        </p>
                    )}

                    {!connections && !error ? (
                        <div className="flex flex-col gap-2">
                            {PLATFORM_META.map((meta) => (
                                <div
                                    key={meta.id}
                                    className="h-[56px] animate-pulse border border-zinc-800 bg-zinc-900/40"
                                />
                            ))}
                        </div>
                    ) : (
                        <div className="flex flex-col gap-2">
                            {PLATFORM_META.map((meta) => {
                                const connection: ConnectionStatus =
                                    connections?.[meta.id] ?? {
                                        connected: false,
                                    };

                                return (
                                    <PlatformCard
                                        key={meta.id}
                                        meta={meta}
                                        connection={connection}
                                        onDisconnect={() =>
                                            handleDisconnect(meta.id)
                                        }
                                    />
                                );
                            })}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}