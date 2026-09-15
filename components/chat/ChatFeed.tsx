"use client";

import { useEffect, useRef, useState } from "react";
import { TwitchChatMessage } from "@/lib/twitchIrc";
import { BadgeMap } from "@/lib/twitchBadges";

export type FeedMessage = TwitchChatMessage & {
    badgeMap: BadgeMap;
    channelLabel?: string;
    channelColor?: string;
};

export function ChatFeed({
                             messages,
                             emptyLabel = "Aguardando mensagens do chat…",
                             showChannelTag = false,
                         }: {
    messages: FeedMessage[];
    emptyLabel?: string;
    showChannelTag?: boolean;
}) {
    const [autoScroll, setAutoScroll] = useState(true);
    const scrollRef = useRef<HTMLDivElement | null>(null);
    const isInitialScrollRef = useRef(true);

    useEffect(() => {
        const el = scrollRef.current;
        if (!el || !autoScroll) return;

        requestAnimationFrame(() => {
            el.scrollTo({
                top: el.scrollHeight,
                behavior: isInitialScrollRef.current ? "auto" : "smooth",
            });
            isInitialScrollRef.current = false;
        });
    }, [messages, autoScroll]);

    function handleScroll() {
        const el = scrollRef.current;
        if (!el) return;
        const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
        setAutoScroll(distanceFromBottom <= 80);
    }

    return (
        <div className="relative flex-1 min-h-0">
            <div
                ref={scrollRef}
                onScroll={handleScroll}
                className="h-full overflow-y-auto px-3 py-3 space-y-1.5 bg-twitch-dark"
            >
                {messages.length === 0 && (
                    <p className="text-zinc-500 text-sm">{emptyLabel}</p>
                )}

                {messages.map((m) => (
                    <div
                        key={`${m.channel}-${m.id}`}
                        className="text-sm leading-relaxed break-words flex items-start gap-1 flex-wrap"
                    >
                        {showChannelTag && (
                            <span
                                className="text-[10px] font-bold uppercase tracking-wide rounded px-1.5 py-0.5 shrink-0"
                                style={{
                                    backgroundColor: `${m.channelColor ?? "#9146FF"}22`,
                                    color: m.channelColor ?? "#9146FF",
                                }}
                            >
                {m.channelLabel ?? m.channel}
              </span>
                        )}

                        {m.badges.length > 0 && (
                            <span className="inline-flex items-center gap-1 translate-y-[2px]">
                                {m.badges.map((badge) => {
                                    const info =
                                        m.badgeMap[badge.setId]?.[badge.version];

                                    if (!info) {
                                        return null;
                                    }

                                    return (
                                        <img
                                            key={`${badge.setId}-${badge.version}`}
                                            src={info.image_url_1x}
                                            srcSet={`
                                        ${info.image_url_1x} 1x,
                                        ${info.image_url_2x} 2x,
                                        ${info.image_url_4x} 4x
                                      `}
                                            alt={info.title}
                                            title={`${info.title}${info.description ? ` — ${info.description}` : ""}`}
                                            loading="lazy"
                                            className="h-[18px] w-[18px] shrink-0 object-contain"
                                        />
                                    );
                                })}
                              </span>
                        )}


                        <span style={{ color: m.color }} className="font-semibold">
              {m.displayName}
            </span>

                        <span className="text-zinc-400">: </span>

                        <span
                            className={m.isAction ? "italic text-zinc-300" : "text-zinc-100"}
                        >
              {m.message}
            </span>
                    </div>
                ))}
            </div>

            {!autoScroll && (
                <button
                    onClick={() => {
                        setAutoScroll(true);
                        requestAnimationFrame(() => {
                            scrollRef.current?.scrollTo({
                                top: scrollRef.current.scrollHeight,
                                behavior: "smooth",
                            });
                        });
                    }}
                    className="absolute bottom-4 right-4 z-10 rounded-full bg-twitch-purple px-4 py-2 text-sm font-medium shadow-lg hover:bg-purple-600 transition-colors"
                >
                    + mensagens
                </button>
            )}
        </div>
    );
}