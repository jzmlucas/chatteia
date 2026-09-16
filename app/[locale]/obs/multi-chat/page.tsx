"use client";

import {
    useCallback,
    useMemo,
    useState,
} from "react";

import { useSearchParams } from "next/navigation";
import { useObsTransparentBackground } from "@/hooks/chat/useObsTransparentBackground";

import type {
    UnifiedChatMessage,
} from "@/lib/chat/types";

import {
    TwitchMultiChatConnections,
} from "@/hooks/platforms/twitch/useTwitchMultiChat";

import {
    ChatFeed,
} from "@/components/chat/ChatFeed";

export default function ObsMultiChatPage() {
    useObsTransparentBackground();
    const searchParams = useSearchParams();

    const channels = useMemo(
        () =>
            (
                searchParams.get("channels") ?? ""
            )
                .split(",")
                .map((channel) =>
                    channel.trim().toLowerCase()
                )
                .filter(Boolean),
        [searchParams]
    );

    const [
        channelMessages,
        setChannelMessages,
    ] = useState<
        Record<
            string,
            UnifiedChatMessage[]
        >
    >({});

    const handleMessages = useCallback(
        (
            channel: string,
            messages: UnifiedChatMessage[]
        ) => {
            setChannelMessages((current) => ({
                ...current,
                [channel]: messages,
            }));
        },
        []
    );

    const messages = useMemo(
        () =>
            channels
                .flatMap((channel) =>
                    (
                        channelMessages[channel] ?? []
                    ).map((message) => ({
                        ...message,
                        channelLabel: channel,
                    }))
                )
                .sort(
                    (a, b) =>
                        a.timestamp - b.timestamp
                ),
        [channels, channelMessages]
    );

    return (
        <main className="h-screen w-screen overflow-hidden bg-transparent">
            <div className="hidden">
                <TwitchMultiChatConnections
                    channels={channels}
                    onMessages={handleMessages}
                />
            </div>

            <ChatFeed
                messages={messages}
                showChannelTag
                variant="obs"
                emptyLabel=""
            />
        </main>
    );
}