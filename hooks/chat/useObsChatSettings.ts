"use client";

import {
    useCallback,
    useEffect,
    useMemo,
    useState,
} from "react";

import {
    DEFAULT_OBS_CHAT_SETTINGS,
    ObsChatSettings,
} from "@/types/chat/obs";

const SETTINGS_PARAM = "settings";

function encodeSettings(
    settings: ObsChatSettings
): string {
    try {
        const json =
            JSON.stringify(
                settings
            );

        return btoa(
            encodeURIComponent(json)
                .replace(
                    /%([0-9A-F]{2})/g,
                    (_, p1) =>
                        String.fromCharCode(
                            parseInt(
                                p1,
                                16
                            )
                        )
                )
        );
    } catch {
        return "";
    }
}

function decodeSettings(
    value: string
): ObsChatSettings | null {
    try {
        const binary =
            atob(value);

        const bytes =
            Uint8Array.from(
                binary,
                (char) =>
                    char.charCodeAt(
                        0
                    )
            );

        const json =
            decodeURIComponent(
                Array.from(bytes)
                    .map(
                        (byte) =>
                            `%${byte
    .toString(
        16
    )
    .padStart(
        2,
        "0"
    )}`
                    )
                    .join("")
            );

        const parsed =
            JSON.parse(json);

        return {
            ...DEFAULT_OBS_CHAT_SETTINGS,
            ...parsed,
        };
    } catch {
        return null;
    }
}

export function useObsChatSettings() {
    const [
        settings,
        setSettings,
    ] =
        useState<ObsChatSettings>(
            DEFAULT_OBS_CHAT_SETTINGS
        );

    const [
        mounted,
        setMounted,
    ] =
        useState(false);

    /*
     * ----------------------------------------------------------------------
     * LER CONFIGURAÇÕES DA URL
     * ----------------------------------------------------------------------
     */

    useEffect(() => {
        setMounted(true);

        const params =
            new URLSearchParams(
                window.location.search
            );

        const encoded =
            params.get(
                SETTINGS_PARAM
            );

        if (!encoded) {
            return;
        }

        const decoded =
            decodeSettings(
                encoded
            );

        if (decoded) {
            setSettings(
                decoded
            );
        }
    }, []);

    /*
     * ----------------------------------------------------------------------
     * ATUALIZAR CONFIGURAÇÕES
     * ----------------------------------------------------------------------
     */

    const updateSettings =
        useCallback(
            (
                changes:
                    | Partial<ObsChatSettings>
                    | ((
                          current: ObsChatSettings
                      ) =>
                          Partial<ObsChatSettings>)
            ) => {
                setSettings(
                    (current) => {
                        const nextChanges =
                            typeof changes ===
                            "function"
                                ? changes(
                                      current
                                  )
                                : changes;

                        return {
                            ...current,
                            ...nextChanges,
                        };
                    }
                );
            },
            []
        );

    /*
     * ----------------------------------------------------------------------
     * GERAR URL DO OBS
     * ----------------------------------------------------------------------
     */

    const obsUrl =
        useMemo(() => {
            if (!mounted) {
                return "";
            }

            const encoded =
                encodeSettings(
                    settings
                );

            /*
             * A URL da página de configuração
             * NÃO deve ser usada como base.
             *
             * O overlay real está sempre em:
             *
             * /[locale]/obs/[channel]
             */

            const pathname =
                window.location.pathname;

            /*
             * Exemplo:
             *
             * /pt-br/chat/twitch/turbao8/settings
             *
             * Precisamos descobrir:
             *
             * locale  = pt-br
             * channel = turbao8
             */

            const segments =
                pathname
                    .split("/")
                    .filter(
                        Boolean
                    );

            const locale =
                segments[0];

            const channel =
                segments[
                    segments.length -
                        2
                ];

            if (
                !locale ||
                !channel
            ) {
                return "";
            }

            const url =
                new URL(
                    `/${locale}/obs/${channel}`,
                    window.location.origin
                );

            url.searchParams.set(
                SETTINGS_PARAM,
                encoded
            );

            return url.toString();
        }, [
            settings,
            mounted,
        ]);

    /*
     * ----------------------------------------------------------------------
     * RESTAURAR PADRÕES
     * ----------------------------------------------------------------------
     */

    const resetSettings =
        useCallback(() => {
            setSettings(
                DEFAULT_OBS_CHAT_SETTINGS
            );
        }, []);

    return {
        settings,
        setSettings,
        updateSettings,
        resetSettings,
        obsUrl,
    };
}