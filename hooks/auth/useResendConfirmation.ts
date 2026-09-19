import { useState } from "react";

import { useTranslations } from "next-intl";

import { translateAuthError } from "@/lib/auth/errors";
import { useEmailCooldown } from "@/hooks/auth/useEmailCooldown";

const RESEND_COOLDOWN_SECONDS = 60;

export function useResendConfirmation() {
    const t = useTranslations("auth");

    const cooldown = useEmailCooldown("confirmation-resend");

    const [error, setError] = useState<string | null>(null);
    const [message, setMessage] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    async function resend(email: string) {
        if (cooldown.isCoolingDown || !email.trim()) {
            return;
        }

        setError(null);
        setMessage(null);
        setLoading(true);

        let response: Response;

        try {
            response = await fetch("/api/auth/resend-verification", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email: email.trim() }),
            });
        } catch {
            setLoading(false);
            setError(translateAuthError("NETWORK_ERROR", t));

            return;
        }

        setLoading(false);
        cooldown.start(RESEND_COOLDOWN_SECONDS);

        if (!response.ok) {
            const data = await response.json().catch(() => ({}));

            setError(translateAuthError(data.error ?? "GENERIC", t));

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
