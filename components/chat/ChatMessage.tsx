"use client";

import type {
    UnifiedChatMessage,
} from "@/lib/chat/types";

import {
    ChatMessageContent,
} from "./ChatMessageContent";

export type FeedMessage =
    UnifiedChatMessage & {
    channelLabel?: string;
    channelColor?: string;
};

export function ChatMessage({
                                message,
                                showChannelTag,
                            }: {
    message: FeedMessage;
    showChannelTag: boolean;
}) {
    return (
        <div
            className="
        flex
        flex-wrap
        items-start
        gap-1
        break-words
        text-sm
        leading-relaxed
      "
        >
            {showChannelTag && (
                <span
                    className="
            shrink-0
            rounded
            px-1.5
            py-0.5
            text-[10px]
            font-bold
            uppercase
            tracking-wide
          "
                    style={{
                        backgroundColor:
                            `${message.channelColor ?? "#9146FF"}22`,
                        color:
                            message.channelColor ??
                            "#9146FF",
                    }}
                >
          {message.channelLabel ??
              message.channel}
        </span>
            )}

            {message.badges.length > 0 && (
                <span
                    className="
            inline-flex
            shrink-0
            items-center
            gap-1
            translate-y-[1px]
          "
                >
          {message.badges.map(
              (badge) => (
                  <img
                      key={badge.id}
                      src={badge.imageUrl}
                      alt={
                          badge.name ??
                          ""
                      }
                      title={
                          badge.description
                              ? `${badge.name ?? ""} — ${badge.description}`
                              : badge.name ?? ""
                      }
                      loading="lazy"
                      className="
                  h-[18px]
                  w-[18px]
                  shrink-0
                  object-contain
                "
                  />
              )
          )}
        </span>
            )}

            <span
                className="font-semibold"
                style={{
                    color: message.color,
                }}
            >
        {message.displayName}
      </span>

            <span className="text-zinc-400">
        :
      </span>

            <span
                className={
                    message.isAction
                        ? "italic text-zinc-300"
                        : "text-zinc-100"
                }
            >
        <ChatMessageContent
            message={message}
        />
      </span>
        </div>
    );
}