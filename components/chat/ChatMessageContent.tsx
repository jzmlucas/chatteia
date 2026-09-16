"use client";

import type {
    UnifiedChatMessage,
} from "@/lib/chat/types";

export function ChatMessageContent({
                                       message,
                                   }: {
    message: UnifiedChatMessage;
}) {
    if (
        !message.emotes ||
        message.emotes.length === 0
    ) {
        return <>{message.message}</>;
    }

    const parts: React.ReactNode[] = [];
    let cursor = 0;

    for (const emote of message.emotes) {
        if (emote.start > cursor) {
            parts.push(
                <span
                    key={`text-${cursor}`}
        >
            {message.message.slice(
                cursor,
                emote.start
            )}
            </span>
        );
        }

        const emoteText =
            message.message.slice(
                emote.start,
                emote.end + 1
            );

        parts.push(
            <img
                key={`emote-${emote.provider}-${emote.id}-${emote.start}`}
        src={emote.imageUrl}
        alt={emoteText}
        title={
            emote.name ||
                emoteText
        }
        loading="lazy"
        className="
        inline-block
        h-[24px]
        w-[24px]
        align-middle
        object-contain
        "
        />
    );

        cursor = emote.end + 1;
    }

    if (
        cursor <
        message.message.length
    ) {
        parts.push(
            <span
                key={`text-${cursor}`}
    >
        {message.message.slice(
            cursor
        )}
        </span>
    );
    }

    return <>{parts}</>;
}