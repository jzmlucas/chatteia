"use client";

import {
  useEffect,
  useRef,
  useState,
} from "react";

import type {
  UnifiedChatMessage,
} from "@/lib/chat/types";

import {
  TwitchChatClient,
  type TwitchIrcStatus,
} from "@/lib/platforms/twitch/irc";

import {
  fetchBadgeMap,
  type BadgeMap,
} from "@/lib/platforms/twitch/badges";

import {
  fetchTwitchExternalEmoteMap,
  type TwitchExternalEmoteMap,
} from "@/lib/platforms/twitch/emotes";

import {
  normalizeTwitchMessage,
} from "@/lib/platforms/twitch/adapter";

const MAX_MESSAGES = 300;

const MESSAGE_BATCH_INTERVAL = 50;

const MAX_SEEN_MESSAGE_IDS = 2000;

export type TwitchChannelData = {
  messages: UnifiedChatMessage[];
  status: TwitchIrcStatus;
  statusDetail: string | undefined;
  badgeMap: BadgeMap;
  externalEmotes: TwitchExternalEmoteMap;
};

export function useTwitchChannel(
    channel: string
): TwitchChannelData {
  const [messages, setMessages] =
      useState<UnifiedChatMessage[]>([]);

  const [status, setStatus] =
      useState<TwitchIrcStatus>("idle");

  const [statusDetail, setStatusDetail] =
      useState<string | undefined>();

  const [badgeMap, setBadgeMap] =
      useState<BadgeMap>({});

  const [externalEmotes, setExternalEmotes] =
      useState<TwitchExternalEmoteMap>({});

  const badgeMapRef =
      useRef<BadgeMap>({});

  const externalEmotesRef =
      useRef<TwitchExternalEmoteMap>({});

  useEffect(() => {
    if (!channel) {
      return;
    }

    let active = true;

    const seenMessageIds =
        new Set<string>();

    const pendingMessages:
        UnifiedChatMessage[] = [];

    let batchTimer:
        | ReturnType<typeof setTimeout>
        | null = null;

    let badgeMapPromise:
        | Promise<BadgeMap>
        | null = null;

    let externalEmotesPromise:
        | Promise<TwitchExternalEmoteMap>
        | null = null;

    setMessages([]);
    setStatus("idle");
    setStatusDetail(undefined);
    setBadgeMap({});
    setExternalEmotes({});

    badgeMapRef.current = {};
    externalEmotesRef.current = {};

    function clearBatchTimer() {
      if (batchTimer !== null) {
        clearTimeout(batchTimer);
        batchTimer = null;
      }
    }

    function flushMessages() {
      batchTimer = null;

      if (!active) {
        pendingMessages.length = 0;
        return;
      }

      if (pendingMessages.length === 0) {
        return;
      }

      const batch =
          pendingMessages.splice(
              0,
              pendingMessages.length
          );

      setMessages((prev) => {
        if (!active) {
          return prev;
        }

        const next = [
          ...prev,
          ...batch,
        ];

        if (
            next.length <=
            MAX_MESSAGES
        ) {
          return next;
        }

        return next.slice(
            next.length -
            MAX_MESSAGES
        );
      });
    }

    function enqueueMessage(
        message: UnifiedChatMessage
    ) {
      if (!active) {
        return;
      }

      pendingMessages.push(
          message
      );

      if (batchTimer === null) {
        batchTimer =
            setTimeout(
                flushMessages,
                MESSAGE_BATCH_INTERVAL
            );
      }
    }

    function markMessageAsSeen(
        messageId: string
    ): boolean {
      if (!messageId) {
        return true;
      }

      if (
          seenMessageIds.has(
              messageId
          )
      ) {
        return false;
      }

      seenMessageIds.add(
          messageId
      );

      if (
          seenMessageIds.size >
          MAX_SEEN_MESSAGE_IDS
      ) {
        const oldestId =
            seenMessageIds.values().next()
                .value;

        if (
            typeof oldestId ===
            "string"
        ) {
          seenMessageIds.delete(
              oldestId
          );
        }
      }

      return true;
    }

    async function loadBadgeMap(
        channelId: string
    ): Promise<BadgeMap> {
      if (
          Object.keys(
              badgeMapRef.current
          ).length > 0
      ) {
        return badgeMapRef.current;
      }

      if (badgeMapPromise) {
        return badgeMapPromise;
      }

      console.log(
          "[TwitchBadges] Carregando badges:",
          channelId
      );

      const promise =
          fetchBadgeMap(
              channelId
          )
              .then((map) => {
                if (!active) {
                  return map;
                }

                badgeMapRef.current =
                    map;

                setBadgeMap(map);

                console.log(
                    "[TwitchBadges] Carregados:",
                    Object.keys(map).length
                );

                return map;
              })
              .catch((error) => {
                console.error(
                    "[TwitchBadges] Erro:",
                    error
                );

                return {};
              });

      badgeMapPromise =
          promise;

      return promise;
    }

    async function loadExternalEmotes(
        channelId: string
    ): Promise<TwitchExternalEmoteMap> {
      if (
          externalEmotesPromise
      ) {
        return externalEmotesPromise;
      }

      if (
          Object.keys(
              externalEmotesRef.current
          ).length > 0
      ) {
        return externalEmotesRef.current;
      }

      console.log(
          "[TwitchEmotes] Carregando 7TV, BTTV e FFZ:",
          channelId
      );

      const promise =
          fetchTwitchExternalEmoteMap(
              channelId
          )
              .then((map) => {
                if (!active) {
                  return map;
                }

                externalEmotesRef.current =
                    map;

                setExternalEmotes(
                    map
                );

                console.log(
                    "[TwitchEmotes] Carregados:",
                    Object.keys(map).length
                );

                return map;
              })
              .catch((error) => {
                console.error(
                    "[TwitchEmotes] Erro:",
                    error
                );

                return {};
              });

      externalEmotesPromise =
          promise;

      return promise;
    }

    const client =
        new TwitchChatClient(
            channel,
            {
              onMessage: async (msg) => {
                if (!active) {
                  return;
                }

                if (
                    !markMessageAsSeen(
                        msg.id
                    )
                ) {
                  return;
                }

                let currentBadgeMap =
                    badgeMapRef.current;

                let currentExternalEmotes =
                    externalEmotesRef.current;

                if (msg.channelId) {
                  const channelId =
                      msg.channelId;

                  const [
                    loadedBadges,
                    loadedExternalEmotes,
                  ] = await Promise.all([
                    loadBadgeMap(
                        channelId
                    ),
                    loadExternalEmotes(
                        channelId
                    ),
                  ]);

                  if (!active) {
                    return;
                  }

                  currentBadgeMap =
                      loadedBadges;

                  currentExternalEmotes =
                      loadedExternalEmotes;
                }

                if (!active) {
                  return;
                }

                const normalized =
                    normalizeTwitchMessage(
                        msg,
                        currentBadgeMap,
                        currentExternalEmotes
                    );

                enqueueMessage(
                    normalized
                );
              },

              onStatus: (
                  nextStatus,
                  detail
              ) => {
                if (!active) {
                  return;
                }

                setStatus(
                    nextStatus
                );

                setStatusDetail(
                    detail
                );
              },
            }
        );

    client.connect();

    return () => {
      active = false;

      clearBatchTimer();

      pendingMessages.length = 0;

      seenMessageIds.clear();

      client.disconnect();
    };
  }, [channel]);

  return {
    messages,
    status,
    statusDetail,
    badgeMap,
    externalEmotes,
  };
}