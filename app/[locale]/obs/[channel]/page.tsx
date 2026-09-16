"use client";

import { useParams } from "next/navigation";

import {
    useTwitchChannel,
} from "@/hooks/platforms/twitch/useTwitchChannel";

import {
    ChatFeed,
} from "@/components/chat/ChatFeed";
import { useObsTransparentBackground } from "@/hooks/chat/useObsTransparentBackground";

export default function ObsChatPage() {
    useObsTransparentBackground();

    const params = useParams<{
        channel: string;
    }>();

    const {
        messages,
    } = useTwitchChannel(
        params.channel
    );

    return (
        <main className="h-screen w-screen overflow-hidden bg-transparent">
            <ChatFeed
                messages={messages}
                showChannelTag={false}
                variant="obs"
                emptyLabel=""
            />
        </main>
    );
}