"use client";

import { useEffect, useRef, useState } from "react";

import {
  TwitchChatClient,
  TwitchChatMessage,
  TwitchIrcStatus,
} from "@/lib/twitchIrc";

import {
  fetchBadgeMap,
  BadgeMap,
} from "@/lib/twitchBadges";

const MAX_MESSAGES = 300;

export type TwitchChannelData = {
  messages: TwitchChatMessage[];
  status: TwitchIrcStatus;
  statusDetail: string | undefined;
  badgeMap: BadgeMap;
};

export function useTwitchChannel(
  channel: string
): TwitchChannelData {
  const [messages, setMessages] = useState<TwitchChatMessage[]>([]);
  const [status, setStatus] =
    useState<TwitchIrcStatus>("idle");

  const [statusDetail, setStatusDetail] =
    useState<string | undefined>();

  const [badgeMap, setBadgeMap] =
    useState<BadgeMap>({});

  const badgesLoadedForChannelId =
    useRef<string | null>(null);

  useEffect(() => {
    if (!channel) {
      return;
    }

    setMessages([]);
    setStatus("idle");
    setStatusDetail(undefined);
    setBadgeMap({});

    badgesLoadedForChannelId.current = null;

    const client = new TwitchChatClient(channel, {
      onMessage: (msg) => {
        setMessages((prev) => {
          const next = [...prev, msg];

          if (next.length > MAX_MESSAGES) {
            next.shift();
          }

          return next;
        });

        /*
         * A Twitch IRC message contém:
         *
         * room-id=123456
         *
         * Esse ID é necessário para buscar os
         * badges específicos daquele canal.
         */
        if (
          msg.channelId &&
          badgesLoadedForChannelId.current !== msg.channelId
        ) {
          badgesLoadedForChannelId.current =
            msg.channelId;

          fetchBadgeMap(msg.channelId)
            .then((map) => {
              setBadgeMap(map);

              console.log(
                "[TwitchBadges] Badges carregados:",
                Object.keys(map)
              );
            })
            .catch((error) => {
              console.error(
                "[TwitchBadges] Erro:",
                error
              );
            });
        }
      },

      onStatus: (status, detail) => {
        setStatus(status);
        setStatusDetail(detail);
      },
    });

    client.connect();

    return () => {
      client.disconnect();
    };
  }, [channel]);

  return {
    messages,
    status,
    statusDetail,
    badgeMap,
  };
}