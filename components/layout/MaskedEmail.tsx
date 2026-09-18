"use client";

import { useTranslations } from "next-intl";

import { maskEmail, useRevealEmail } from "@/hooks/useRevealEmail";

type MaskedEmailProps = {
    email: string | null | undefined;
    className?: string;
    prefix?: string;
};

/**
 * Exibe o e-mail do usuário escondido por padrão (mascarado), com um
 * botão de "olho" para alternar entre mostrar e esconder. A escolha
 * fica salva no navegador do usuário.
 */
export function MaskedEmail({
    email,
    className,
    prefix,
}: MaskedEmailProps) {
    const t = useTranslations("auth");

    const { revealed, toggle } = useRevealEmail();

    if (!email) {
        return null;
    }

    return (
        <span
            className={`inline-flex items-center gap-1.5 ${
                className ?? ""
            }`}
        >
            {prefix ? <span>{prefix}</span> : null}

            <span>{revealed ? email : maskEmail(email)}</span>

            <button
                type="button"
                onClick={(event) => {
                    event.stopPropagation();
                    toggle();
                }}
                title={
                    revealed
                        ? t("hideEmail")
                        : t("showEmail")
                }
                aria-label={
                    revealed
                        ? t("hideEmail")
                        : t("showEmail")
                }
                className="shrink-0 rounded p-0.5 text-zinc-500 transition-colors hover:text-zinc-200"
            >
                {revealed ? (
                    // olho fechado
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="h-3.5 w-3.5"
                    >
                        <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" />
                        <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" />
                        <path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" />
                        <line x1="2" y1="2" x2="22" y2="22" />
                    </svg>
                ) : (
                    // olho aberto
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="h-3.5 w-3.5"
                    >
                        <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
                        <circle cx="12" cy="12" r="3" />
                    </svg>
                )}
            </button>
        </span>
    );
}
