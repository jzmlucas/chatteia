import { useState } from "react";

import { useTranslations } from "next-intl";

import { supabaseBrowser } from "@/lib/supabase/client";
import { translateAuthError } from "@/lib/auth/errors";
import { useEmailCooldown } from "@/hooks/auth/useEmailCooldown";

const RESEND_COOLDOWN_SECONDS = 60;

export function useResendConfirmation() {
    const t = useTranslations("auth");

    const cooldown = useEmailCooldown("confirmation-resend");

    const [error, setError] =
        useState<string | null>(null);

    const [message, setMessage] =
        useState<string | null>(null);

    const [loading, setLoading] =
        useState(false);

    async function resend(email: string) {
        if (cooldown.isCoolingDown || !email.trim()) {
            return;
        }

        setError(null);
        setMessage(null);
        setLoading(true);

        const { error: resendError } =
            await supabaseBrowser.auth.resend({
                type: "signup",
                email: email.trim(),
            });

        setLoading(false);
        cooldown.start(RESEND_COOLDOWN_SECONDS);

        if (resendError) {
            setError(
                translateAuthError(resendError.message, t)
            );

            return;
        }

        setMessage(t("resendSuccess"));
    }

    return {
        resend,
        loading,
        error,
        message,
        cooldownSeconds: cooldown.secondsLeft,
        isCoolingDown: cooldown.isCoolingDown,
    };
}
