import { FormEvent, useState } from "react";

import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";

import { translateAuthError } from "@/lib/auth/errors";
import type { AccountType } from "@/types/user";

const USERNAME_REGEX = /^[a-zA-Z0-9_]{3,20}$/;

export function useRegisterForm() {
    const t = useTranslations("auth");
    const router = useRouter();

    const [accountType, setAccountType] = useState<AccountType>("user");
    const [username, setUsername] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

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

    async function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();

        setError(null);

        const validationError = validate();

        if (validationError) {
            setError(validationError);
            return;
        }

        setLoading(true);

        let response: Response;

        try {
            response = await fetch("/api/auth/register", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    email: email.trim(),
                    username: username.trim(),
                    password,
                    accountType,
                }),
            });
        } catch {
            setLoading(false);
            setError(translateAuthError("NETWORK_ERROR", t));
            return;
        }

        if (!response.ok) {
            setLoading(false);

            const data = await response.json().catch(() => ({}));

            setError(
                translateAuthError(
                    data.error ?? "GENERIC",
                    t
                )
            );

            return;
        }

        /*
         * Cadastro realizado com sucesso.
         *
         * Não enviamos e-mail de confirmação e não mostramos
         * uma tela intermediária.
         *
         * O usuário vai diretamente para o login.
         */
        router.push("/login");
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
        loading,
        handleSubmit,
    };
}
