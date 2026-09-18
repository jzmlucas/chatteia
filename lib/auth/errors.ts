/**
 * Supabase Auth retorna mensagens de erro em inglês, direto da API.
 * Esta função mapeia as mais comuns para chaves de tradução do
 * namespace "auth" (ver messages/*.json).
 *
 * `t` é a função de tradução do next-intl (useTranslations("auth")).
 */
export function translateAuthError(
    rawMessage: string,
    t: (key: string) => string
): string {
    const message = rawMessage.toLowerCase();

    if (
        message.includes("email rate limit exceeded") ||
        message.includes("rate limit")
    ) {
        return t("errorRateLimit");
    }

    if (message.includes("invalid login credentials")) {
        return t("errorInvalidCredentials");
    }

    if (message.includes("email not confirmed")) {
        return t("errorEmailNotConfirmed");
    }

    if (
        message.includes("already registered") ||
        message.includes("already been registered") ||
        message.includes("user already exists")
    ) {
        return t("errorEmailTaken");
    }

    if (message.includes("password should be at least")) {
        return t("errorWeakPassword");
    }

    if (
        message.includes("unable to validate email address") ||
        message.includes("invalid email")
    ) {
        return t("errorInvalidEmail");
    }

    if (
        message.includes("network") ||
        message.includes("fetch")
    ) {
        return t("errorNetwork");
    }

    return rawMessage;
}
