"use client";

import {
    useChatAutoScroll,
} from "@/hooks/chat/useChatAutoScroll";

import {
    ChatMessage,
    type FeedMessage,
} from "./ChatMessage";

import {
    ChatNewMessagesButton,
} from "./ChatNewMessagesButton";

export type { FeedMessage };

export function ChatFeed({
                             messages,
                             emptyLabel = "Aguardando mensagens do chat…",
                             showChannelTag = false,
                             variant = "default",
                         }: {
    messages: FeedMessage[];
    emptyLabel?: string;
    showChannelTag?: boolean;
    variant?: "default" | "obs";
}) {
    const {
        scrollRef,
        newMessagesCount,
        handleScroll,
        scrollToBottom,
    } = useChatAutoScroll({
        messageCount:
        messages.length,
    });

    return (
        <div
            className={
                variant === "obs"
                    ? "relative h-full w-full overflow-hidden bg-transparent"
                    : "relative flex-1 min-h-0"
            }
        >
            <div
                ref={scrollRef}
                onScroll={handleScroll}
                className={
                    variant === "obs"
                        ? "h-full w-full overflow-y-auto bg-transparent px-3 py-3 space-y-1.5"
                        : "h-full overflow-y-auto bg-twitch-dark px-3 py-3 space-y-1.5"
                }
            >
                {messages.length === 0 &&
                    emptyLabel && (
                        <p className="text-sm text-zinc-500">
                            {
                                emptyLabel
                            }
                        </p>
                    )}

                {messages.map(
                    (
                        message
                    ) => (
                        <ChatMessage
                            key={`${message.platform}-${message.channel}-${message.id}`}
                            message={
                                message
                            }
                            showChannelTag={
                                showChannelTag
                            }
                        />
                    )
                )}
            </div>

            <ChatNewMessagesButton
                count={
                    newMessagesCount
                }
                onClick={
                    scrollToBottom
                }
            />
        </div>
    );
}