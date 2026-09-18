"use client";

import { useTranslations } from "next-intl";

import { useResendConfirmation } from "@/hooks/auth/useResendConfirmation";

type ResendConfirmationEmailProps = {
    email: string;
    resend?: ReturnType<typeof useResendConfirmation>;
};

export function ResendConfirmationEmail({
                                             email,
                                             resend: externalResend,
                                         }: ResendConfirmationEmailProps) {
    const t = useTranslations("auth");

    const ownResend = useResendConfirmation();
    const resend = externalResend ?? ownResend;

    return (
        <div className="mt-3 flex flex-col gap-2">
            <button
                type="button"
                onClick={() => resend.resend(email)}
                disabled={resend.isCoolingDown || resend.loading || !email.trim()}
                className="w-full rounded-lg border border-twitch-border px-4 py-2.5 text-sm font-medium text-zinc-200 transition-colors hover:border-zinc-500 disabled:cursor-not-allowed disabled:opacity-50"
            >
                {resend.isCoolingDown
                    ? `${t("resendButton")} (${resend.cooldownSeconds}s)`
                    : resend.loading
                        ? t("loading")
                        : t("resendButton")}
            </button>

            {resend.message && (
                <p className="rounded-lg bg-green-950/50 px-3 py-2 text-xs text-green-400">
                    {resend.message}
                </p>
            )}

            {resend.error && (
                <p className="rounded-lg bg-red-950/50 px-3 py-2 text-xs text-red-400">
                    {resend.error}
                </p>
            )}
        </div>
    );
}
