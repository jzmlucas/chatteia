"use client";

import { useCallback, useEffect, useState } from "react";

const STORAGE_KEY = "chatteia:show-email";

/**
 * Controla se o e-mail do usuário deve ser exibido em claro ou
 * escondido (mascarado) na interface. Por padrão o e-mail fica
 * escondido — o usuário pode alternar manualmente para exibi-lo,
 * e essa preferência é lembrada no navegador (localStorage).
 *
 * Isso NÃO remove nenhuma funcionalidade: o e-mail continua
 * disponível, apenas oculto visualmente até o usuário optar por
 * mostrá-lo, o que ajuda a evitar exposição acidental em prints,
 * compartilhamento de tela, etc.
 */
export function useRevealEmail() {
    const [revealed, setRevealed] = useState(false);

    useEffect(() => {
        try {
            const stored = window.localStorage.getItem(STORAGE_KEY);
            setRevealed(stored === "true");
        } catch {
            // localStorage indisponível (SSR, modo privado, etc.) — mantém oculto.
        }
    }, []);

    const toggle = useCallback(() => {
        setRevealed((prev) => {
            const next = !prev;

            try {
                window.localStorage.setItem(
                    STORAGE_KEY,
                    next ? "true" : "false"
                );
            } catch {
                // Ignora falha ao persistir a preferência.
            }

            return next;
        });
    }, []);

    return { revealed, toggle };
}

/**
 * Mascara um e-mail mantendo apenas a primeira letra visível,
 * ex.: "usuario@dominio.com" -> "u••••••@d••••••.com"
 */
export function maskEmail(email: string | null | undefined): string {
    if (!email) {
        return "";
    }

    const [rawUser, rawDomain] = email.split("@");

    if (!rawDomain) {
        return "••••••";
    }

    const maskPart = (value: string) => {
        if (value.length <= 1) {
            return "•".repeat(Math.max(value.length, 1));
        }

        return `${value[0]}${"•".repeat(Math.max(value.length - 1, 3))}`;
    };

    const domainSegments = rawDomain.split(".");
    const maskedDomain = domainSegments
        .map((segment, index) =>
            index === domainSegments.length - 1
                ? segment
                : maskPart(segment)
        )
        .join(".");

    return `${maskPart(rawUser)}@${maskedDomain}`;
}
