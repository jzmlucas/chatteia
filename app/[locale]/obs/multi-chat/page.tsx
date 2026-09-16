"use client";

import { useParams } from "next/navigation";

import {
    useTwitchMultiChat,
} from "@/hooks/platforms/twitch/useTwitchMultiChat";

import {
    ChatFeed,
} from "@/components/chat/ChatFeed";

export default function ObsMultiChatPage() {
    const params = useParams<{
        locale: string;
    }>();

    const searchParams =
        new URLSearchParams(
            typeof window !== "undefined"
                ? window.location.search
                : ""
        );

    const channels =
        searchParams
            .get("channels")
            ?.split(",")
            .map((channel) =>
                channel.trim()
            )
            .filter(Boolean) ?? [];

    const {
        messages,
    } = useTwitchMultiChat(
        channels
    );

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