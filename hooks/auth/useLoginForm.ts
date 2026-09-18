import { FormEvent, useState } from "react";

import { useTranslations } from "next-intl";

import { useRouter } from "@/i18n/navigation";

import { supabaseBrowser } from "@/lib/supabase/client";
import { translateAuthError } from "@/lib/auth/errors";

export function useLoginForm() {
    const router = useRouter();

    const t = useTranslations("auth");

    const [email, setEmail] =
        useState("");

    const [password, setPassword] =
        useState("");

    const [error, setError] =
        useState<string | null>(null);

    const [loading, setLoading] =
        useState(false);

    const [needsResend, setNeedsResend] =
        useState(false);

    async function handleSubmit(
        event: FormEvent<HTMLFormElement>
    ) {
        event.preventDefault();

        setError(null);
        setNeedsResend(false);

        if (!email.trim() || !password) {
            setError(t("errorRequiredFields"));

            return;
        }

        setLoading(true);

        const { error: signInError } =
            await supabaseBrowser.auth.signInWithPassword({
                email: email.trim(),
                password,
            });

        setLoading(false);

        if (signInError) {
            setError(
                translateAuthError(signInError.message, t)
            );

            if (
                signInError.message
                    .toLowerCase()
                    .includes("email not confirmed")
            ) {
                setNeedsResend(true);
            }

            return;
        }

        router.push("/");
        router.refresh();
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
