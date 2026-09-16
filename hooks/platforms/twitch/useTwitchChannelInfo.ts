"use client";

import { useEffect, useState } from "react";

export type TwitchChannelInfo = {
    id: string;
    login: string;
    displayName: string;
    gameName: string;
    title: string;
    isLive: boolean;
    viewerCount: number;
    startedAt: string | null;
};

type TwitchChannelResponse = {
    channel: TwitchChannelInfo;
};

export function useTwitchChannelInfo(channel: string) {
    const [data, setData] = useState<TwitchChannelInfo | null>(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!channel) {
            setData(null);
            return;
        }

        let cancelled = false;

        async function load() {
            try {
                setLoading(true);

                const response = await fetch(
                    `/api/twitch/channel?login=${encodeURIComponent(channel)}`,
                    {
                        cache: "no-store",
                    }
                );

                if (!response.ok) {
                    throw new Error("Erro ao buscar informações do canal.");
                }

                const result =
                    (await response.json()) as TwitchChannelResponse;

                if (!cancelled) {
                    setData(result.channel);
                }
            } catch {
                if (!cancelled) {
                    setData(null);
                }
            } finally {
                if (!cancelled) {
                    setLoading(false);
                }
            }
        }

        load();

        const interval = setInterval(load, 60_000);

        return () => {
            cancelled = true;
            clearInterval(interval);
        };
    }, [channel]);

    return {
        channelInfo: data,
        loading,
    };
}