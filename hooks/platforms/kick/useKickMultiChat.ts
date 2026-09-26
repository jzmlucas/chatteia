"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import type {
  ChatConnectionStatus,
  UnifiedChatMessage,
} from "@/lib/chat/types";

type Connection = {
  channel: string;
  messages: UnifiedChatMessage[];
  status: ChatConnectionStatus;
  statusDetail?: string;
};

type Result = {
  messages: UnifiedChatMessage[];
  connections: Record<string, Connection>;
};

const MAX_MESSAGES = 300;

function normalizeChannels(
    channels: string[]
) {
  return Array.from(
      new Set(
          channels
              .map((channel) =>
                  channel
                      .trim()
                      .replace(/^#/, "")
                      .toLowerCase()
              )
              .filter(
                  (channel) =>
                      /^[a-zA-Z0-9_]{3,25}$/.test(
                          channel
                      )
              )
      )
  );
}

export function useKickMultiChat(
    channels: string[]
): Result {
  const channelKey =
      channels
          .map((channel) =>
              channel
                  .trim()
                  .replace(/^#/, "")
                  .toLowerCase()
          )
          .filter(Boolean)
          .join("|");

  const normalizedChannels =
      useMemo(
          () =>
              normalizeChannels(
                  channels
              ),
          [channelKey]
      );

  const normalizedChannelKey =
      normalizedChannels.join("|");

  const sourcesRef =
      useRef<
          Record<
              string,
              EventSource
          >
      >({});

  const timersRef =
      useRef<
          Record<
              string,
              ReturnType<
                  typeof setTimeout
              >
          >
      >({});

  const attemptsRef =
      useRef<
          Record<
              string,
              number
          >
      >({});

  const mountedRef =
      useRef(false);

  const [
    connections,
    setConnections,
  ] = useState<
      Record<
          string,
          Connection
      >
  >({});

  useEffect(() => {
    mountedRef.current = true;

    return () => {
      mountedRef.current = false;

      const sources =
          Object.values(
              sourcesRef.current
          );

      const timers =
          Object.values(
              timersRef.current
          );

      sourcesRef.current = {};
      timersRef.current = {};
      attemptsRef.current = {};

      for (
          const source of sources
          ) {
        source.close();
      }

      for (
          const timer of timers
          ) {
        clearTimeout(timer);
      }
    };
  }, []);

  useEffect(() => {
    const activeChannels =
        new Set(
            normalizedChannels
        );

    for (
        const channel of Object.keys(
        sourcesRef.current
    )
        ) {
      if (
          activeChannels.has(
              channel
          )
      ) {
        continue;
      }

      sourcesRef.current[
          channel
          ]?.close();

      delete sourcesRef.current[
          channel
          ];

      if (
          timersRef.current[
              channel
              ]
      ) {
        clearTimeout(
            timersRef.current[
                channel
                ]
        );

        delete timersRef.current[
            channel
            ];
      }

      delete attemptsRef.current[
          channel
          ];

      setConnections(
          (current) => {
            if (
                !current[channel]
            ) {
              return current;
            }

            const next = {
              ...current,
            };

            delete next[channel];

            return next;
          }
      );
    }

    function scheduleReconnect(
        channel: string
    ) {
      if (
          !mountedRef.current ||
          !activeChannels.has(
              channel
          )
      ) {
        return;
      }

      if (
          timersRef.current[
              channel
              ]
      ) {
        clearTimeout(
            timersRef.current[
                channel
                ]
        );
      }

      const attempt =
          (attemptsRef.current[
              channel
              ] ?? 0) + 1;

      attemptsRef.current[
          channel
          ] = attempt;

      const delay =
          Math.min(
              1000 *
              2 **
              (attempt -
                  1),
              15000
          );

      setConnections(
          (current) => ({
            ...current,
            [channel]: {
              channel,
              messages:
                  current[
                      channel
                      ]
                      ?.messages ??
                  [],
              status:
                  "reconnecting",
              statusDetail:
                  "Reconectando…",
            },
          })
      );

      timersRef.current[
          channel
          ] = setTimeout(
          () => {
            delete timersRef.current[
                channel
                ];

            connect(
                channel
            );
          },
          delay
      );
    }

    async function checkAuthorization(
        channel: string
    ) {
      const response =
          await fetch(
              `/api/platforms/kick/stream?channel=${encodeURIComponent(
                  channel
              )}`,
              {
                method: "GET",
                cache: "no-store",
              }
          ).catch(
              () => null
          );

      return response;
    }

    function connect(
        channel: string
    ) {
      if (
          !mountedRef.current ||
          !activeChannels.has(
              channel
          )
      ) {
        return;
      }

      if (
          sourcesRef.current[
              channel
              ]
      ) {
        return;
      }

      setConnections(
          (current) => ({
            ...current,
            [channel]: {
              channel,
              messages:
                  current[
                      channel
                      ]
                      ?.messages ??
                  [],
              status:
                  "connecting",
              statusDetail:
                  "Conectando à KICK…",
            },
          })
      );

      const source =
          new EventSource(
              `/api/platforms/kick/stream?channel=${encodeURIComponent(
                  channel
              )}`
          );

      sourcesRef.current[
          channel
          ] = source;

      source.onopen = () => {
        if (
            !mountedRef.current ||
            !activeChannels.has(
                channel
            )
        ) {
          return;
        }

        attemptsRef.current[
            channel
            ] = 0;

        setConnections(
            (current) => ({
              ...current,
              [channel]: {
                channel,
                messages:
                    current[
                        channel
                        ]
                        ?.messages ??
                    [],
                status:
                    "connected",
                statusDetail:
                undefined,
              },
            })
        );
      };

      source.onmessage = (
          event
      ) => {
        if (
            !mountedRef.current ||
            !activeChannels.has(
                channel
            )
        ) {
          return;
        }

        try {
          const message =
              JSON.parse(
                  event.data
              ) as UnifiedChatMessage;

          setConnections(
              (current) => {
                const previous =
                    current[
                        channel
                        ] ?? {
                      channel,
                      messages:
                          [],
                      status:
                          "connected",
                    };

                if (
                    previous.messages.some(
                        (
                            item
                        ) =>
                            item.id ===
                            message.id
                    )
                ) {
                  return current;
                }

                return {
                  ...current,
                  [channel]: {
                    ...previous,
                    status:
                        "connected",
                    statusDetail:
                    undefined,
                    messages:
                        [
                          ...previous.messages,
                          message,
                        ].slice(
                            -MAX_MESSAGES
                        ),
                  },
                };
              }
          );
        } catch (error) {
          console.error("[KICK] Falha ao processar mensagem SSE:", error);
        }
      };

      source.onerror =
          async () => {
            if (
                sourcesRef.current[
                    channel
                    ] !==
                source
            ) {
              return;
            }

            source.close();

            delete sourcesRef.current[
                channel
                ];

            if (
                !mountedRef.current ||
                !activeChannels.has(
                    channel
                )
            ) {
              return;
            }

            const response =
                await checkAuthorization(
                    channel
                );

            if (
                !mountedRef.current ||
                !activeChannels.has(
                    channel
                )
            ) {
              return;
            }

            if (
                response?.status ===
                403
            ) {
              setConnections(
                  (current) => ({
                    ...current,
                    [channel]: {
                      channel,
                      messages:
                          current[
                              channel
                              ]
                              ?.messages ??
                          [],
                      status:
                          "error",
                      statusDetail:
                          "Este canal KICK ainda não autorizou o Chatteia.",
                    },
                  })
              );

              return;
            }

            scheduleReconnect(
                channel
            );
          };
    }

    for (
        const channel of
        normalizedChannels
        ) {
      if (
          sourcesRef.current[
              channel
              ]
      ) {
        continue;
      }

      if (
          timersRef.current[
              channel
              ]
      ) {
        continue;
      }

      connect(channel);
    }
  }, [normalizedChannelKey]);

  const visibleConnections =
      useMemo(
          () => {
            const result: Record<
                string,
                Connection
            > = {};

            for (
                const channel of
                normalizedChannels
                ) {
              result[channel] =
                  connections[
                      channel
                      ] ?? {
                    channel,
                    messages:
                        [],
                    status:
                        "idle",
                  };
            }

            return result;
          },
          [
            normalizedChannels,
            connections,
          ]
      );

  const messages =
      useMemo(
          () =>
              normalizedChannels
                  .flatMap(
                      (
                          channel
                      ) =>
                          visibleConnections[
                              channel
                              ]
                              ?.messages ??
                          []
                  )
                  .sort(
                      (
                          a,
                          b
                      ) =>
                          a.timestamp -
                          b.timestamp
                  ),
          [
            normalizedChannels,
            visibleConnections,
          ]
      );

  return {
    messages,
    connections:
    visibleConnections,
  };
}
