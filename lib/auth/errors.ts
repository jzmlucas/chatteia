/**
 * Mapeia os códigos de erro retornados pelas rotas /api/auth/* (definidos
 * em cada route.ts) para chaves de tradução do namespace "auth"
 * (ver messages/*.json). Antes isso fazia parsing de mensagens em inglês
 * vindas do Supabase; agora são códigos que nós mesmos definimos, então
 * o mapeamento é direto e não pode ficar desatualizado.
 */
export function translateAuthError(
    code: string,
    t: (key: string) => string
): string {
    switch (code) {
        case "REQUIRED_FIELDS":
            return t("errorRequiredFields");
        case "INVALID_EMAIL":
            return t("errorInvalidEmail");
        case "INVALID_USERNAME":
            return t("errorInvalidUsername");
        case "WEAK_PASSWORD":
            return t("errorWeakPassword");
        case "EMAIL_TAKEN":
            return t("errorEmailTaken");
        case "USERNAME_TAKEN":
            return t("errorUsernameTaken");
        case "INVALID_CREDENTIALS":
            return t("errorInvalidCredentials");
        case "EMAIL_NOT_CONFIRMED":
            return t("errorEmailNotConfirmed");
        case "INVALID_OR_EXPIRED_TOKEN":
            return t("errorInvalidOrExpiredToken");
        case "NETWORK_ERROR":
            return t("errorNetwork");
        default:
            return t("errorGeneric");
    }
}
