import { FormEvent, useState } from "react";

import { useTranslations } from "next-intl";

import { useRouter } from "@/i18n/navigation";

import { supabaseBrowser } from "@/lib/supabase/client";
import { translateAuthError } from "@/lib/auth/errors";
import { useEmailCooldown } from "@/hooks/auth/useEmailCooldown";
import { useResendConfirmation } from "@/hooks/auth/useResendConfirmation";
import type { AccountType } from "@/types/supabase";

const USERNAME_REGEX = /^[a-zA-Z0-9_]{3,20}$/;

// Depois de um signUp com sucesso (ou erro de rate limit), trava
// novos envios por um tempo. O Supabase (plano free, e-mail padrão)
// libera só um punhado de e-mails por hora, então evitamos gastar
// essa cota à toa clicando várias vezes.
const SIGNUP_COOLDOWN_SECONDS = 60;

export function useRegisterForm() {
    const router = useRouter();

    const t = useTranslations("auth");

    const [accountType, setAccountType] =
        useState<AccountType>("user");

    const [username, setUsername] =
        useState("");

    const [email, setEmail] =
        useState("");

    const [password, setPassword] =
        useState("");

    const [confirmPassword, setConfirmPassword] =
        useState("");

    const [error, setError] =
        useState<string | null>(null);

    const [success, setSuccess] =
        useState(false);

    const [loading, setLoading] =
        useState(false);

    const cooldown = useEmailCooldown("signup");

    const resendConfirmation = useResendConfirmation();

    function validate() {
        if (
            !username.trim() ||
            !email.trim() ||
            !password ||
            !confirmPassword
        ) {
            return t("errorRequiredFields");
        }

        if (!USERNAME_REGEX.test(username.trim())) {
            return t("errorInvalidUsername");
        }

        if (password.length < 6) {
            return t("errorWeakPassword");
        }

        if (password !== confirmPassword) {
            return t("errorPasswordMismatch");
        }

        return null;
    }

    async function handleSubmit(
        event: FormEvent<HTMLFormElement>
    ) {
        event.preventDefault();

        setError(null);

        if (cooldown.isCoolingDown) {
            setError(
                t("errorCooldown", {
                    seconds: cooldown.secondsLeft,
                })
            );

            return;
        }

        const validationError = validate();

        if (validationError) {
            setError(validationError);

            return;
        }

        setLoading(true);

        const { data: existing } = await supabaseBrowser
            .from("profiles")
            .select("id")
            .ilike("username", username.trim())
            .maybeSingle();

        if (existing) {
            setLoading(false);
            setError(t("errorUsernameTaken"));

            return;
        }

        const { data: signUpData, error: signUpError } =
            await supabaseBrowser.auth.signUp({
                email: email.trim(),
                password,
                options: {
                    data: {
                        username: username.trim(),
                        display_name: username.trim(),
                        account_type: accountType,
                    },
                },
            });

        setLoading(false);

        if (signUpError) {
            setError(
                translateAuthError(signUpError.message, t)
            );

            // Mesmo em erro de rate limit, trava novas tentativas:
            // insistir agora só continuaria batendo no limite.
            if (
                signUpError.message
                    .toLowerCase()
                    .includes("rate limit")
            ) {
                cooldown.start(SIGNUP_COOLDOWN_SECONDS);
            }

            return;
        }

        // Se a confirmação por e-mail estiver desligada no Supabase,
        // o signUp já devolve uma sessão ativa — nesse caso o usuário
        // já está logado e pode ir direto para a homepage.
        if (signUpData.session) {
            router.push("/");
            router.refresh();

            return;
        }

        cooldown.start(SIGNUP_COOLDOWN_SECONDS);
        setSuccess(true);
    }

    return {
        accountType,
        setAccountType,
        username,
        setUsername,
        email,
        setEmail,
        password,
        setPassword,
        confirmPassword,
        setConfirmPassword,
        error,
        success,
        loading,
        isCoolingDown: cooldown.isCoolingDown,
        cooldownSeconds: cooldown.secondsLeft,
        handleSubmit,
        resendConfirmation,
    };
}
