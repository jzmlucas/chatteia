"use client";

import { useEffect, useMemo, useState } from "react";

import { ChatFeed } from "@/components/chat/ChatFeed";

import { useTwitchMultiChat } from "@/hooks/platforms/twitch/useTwitchMultiChat";
import { useKickMultiChat } from "@/hooks/platforms/kick/useKickMultiChat";
import { useYouTubeMultiChat } from "@/hooks/platforms/youtube/useYouTubeMultiChat";
import { useTikTokMultiChat } from "@/hooks/platforms/tiktok/useTikTokMultiChat";

import type { ChatTarget } from "@/lib/chat/targets";

type TokenState =
    | { status: "loading" }
    | { status: "invalid" }
    | { status: "ready"; channels: ChatTarget[] };

/**
 * Resolve o token da URL (?token=...) em uma lista de canais, chamando a
 * API pública de resolução (app/api/obs/multi-chat-link/route.ts). De
 * propósito não usa sessão/cookie: o OBS Browser Source não tem login, a
 * segurança está inteira no token ser um segredo imprevisível.
 */
function useResolvedChannels(token: string | null): TokenState {
    const [state, setState] = useState<TokenState>({
        status: "loading",
    });

    useEffect(() => {
        if (!token) {
            setState({ status: "invalid" });
            return;
        }

        let active = true;

        fetch(
            `/api/obs/multi-chat-link?token=${encodeURIComponent(token)}`
        )
            .then((response) => {
                if (!response.ok) {
                    throw new Error("invalid_token");
                }

                return response.json() as Promise<{
                    channels: ChatTarget[];
                }>;
            })
            .then((data) => {
                if (!active) {
                    return;
                }

                setState({
                    status: "ready",
                    channels: data.channels ?? [],
                });
            })
            .catch(() => {
                if (active) {
                    setState({ status: "invalid" });
                }
            });

        return () => {
            active = false;
        };
    }, [token]);

    return state;
}

export default function ObsMultiChatPage() {
    const [token, setToken] = useState<string | null>(null);

    // Lido do window pra evitar problemas de hidratação (useSearchParams
    // dentro de <Suspense> não é necessário aqui: a página inteira já é
    // client-only, igual era antes desta mudança).
    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        setToken(params.get("token"));
    }, []);

    const resolved = useResolvedChannels(token);

    const channels =
        resolved.status === "ready" ? resolved.channels : [];

    const twitchChannels = useMemo(
        () =>
            channels
                .filter((c) => c.platform === "twitch")
                .map((c) => c.channel),
        [channels]
    );

    const kickChannels = useMemo(
        () =>
            channels
                .filter((c) => c.platform === "kick")
                .map((c) => c.channel),
        [channels]
    );

    const youtubeChannels = useMemo(
        () =>
            channels
                .filter((c) => c.platform === "youtube")
                .map((c) => c.channel),
        [channels]
    );

    const tiktokChannels = useMemo(
        () =>
            channels
                .filter((c) => c.platform === "tiktok")
                .map((c) => c.channel),
        [channels]
    );

    const twitch = useTwitchMultiChat(twitchChannels);
    const kick = useKickMultiChat(kickChannels);
    const youtube = useYouTubeMultiChat(youtubeChannels);
    const tiktok = useTikTokMultiChat(tiktokChannels);

    const messages = useMemo(
        () =>
            [
                ...twitch.messages,
                ...kick.messages,
                ...youtube.messages,
                ...tiktok.messages,
            ].sort((a, b) => a.timestamp - b.timestamp),
        [
            twitch.messages,
            kick.messages,
            youtube.messages,
            tiktok.messages,
        ]
    );

    // Sem overlay visível quando o token é inválido/expirado — nada de
    // mensagem de erro na tela (isso ficaria visível pra audiência da live).
    if (resolved.status !== "ready") {
        return <main className="h-screen w-screen bg-transparent" />;
    }

    return (
        <main className="h-screen w-screen overflow-hidden bg-transparent">
            <ChatFeed
                messages={messages}
                showChannelTag={true}
                variant="obs"
                emptyLabel=""
            />
        </main>
    );
}
