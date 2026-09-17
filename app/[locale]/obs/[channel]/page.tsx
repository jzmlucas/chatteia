"use client";

import { useParams } from "next/navigation";

import {
    useTwitchChannel,
} from "@/hooks/platforms/twitch/useTwitchChannel";

import {
    ChatFeed,
} from "@/components/chat/ChatFeed";

import {
    useObsTransparentBackground,
} from "@/hooks/chat/useObsTransparentBackground";

import {
    useObsChatSettings,
} from "@/hooks/chat/useObsChatSettings";

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

    const {
        settings,
    } = useObsChatSettings();

    const visibleMessages =
        messages.slice(
            -settings.maxMessages
        );

    return (
        <main
            className="h-screen w-screen overflow-hidden bg-transparent"
            style={{
                fontFamily:
                    settings.fontFamily,
                fontSize:
                    `${settings.fontSize}px`,
                fontWeight:
                    settings.fontWeight,
            }}
        >
            <ChatFeed
                messages={
                    visibleMessages
                }
                showChannelTag={false}
                variant="obs"
                emptyLabel=""
                obsSettings={
                    settings
                }
            />
        </main>
    );
}