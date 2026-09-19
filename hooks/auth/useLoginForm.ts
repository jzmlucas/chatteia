import { FormEvent, useState } from "react";

import { useTranslations } from "next-intl";

import { useRouter } from "@/i18n/navigation";

import { useAuth } from "@/contexts/AuthContext";
import { translateAuthError } from "@/lib/auth/errors";

export function useLoginForm() {
    const router = useRouter();
    const { refreshProfile } = useAuth();

    const t = useTranslations("auth");

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [needsResend, setNeedsResend] = useState(false);

    async function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();

        setError(null);
        setNeedsResend(false);

        if (!email.trim() || !password) {
            setError(t("errorRequiredFields"));

            return;
        }

        setLoading(true);

        try {
            const response = await fetch("/api/auth/login", {
                method: "POST",
                credentials: "include",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    email: email.trim(),
                    password,
                }),
            });

            if (!response.ok) {
                const data = await response
                    .json()
                    .catch(() => ({}));

                const code = data.error ?? "GENERIC";

                setError(translateAuthError(code, t));

                if (code === "EMAIL_NOT_CONFIRMED") {
                    setNeedsResend(true);
                }

                return;
            }

            await refreshProfile();

            router.push("/");
        } catch {
            setError(
                translateAuthError(
                    "NETWORK_ERROR",
                    t
                )
            );
        } finally {
            setLoading(false);
        }
    }

    return {
        email,
        setEmail,
        password,
        setPassword,
        error,
        loading,
        needsResend,
        handleSubmit,
    };
}