import { randomBytes, createHash } from "crypto";

/**
 * Gera um token opaco e aleatório (para sessão, verificação de e-mail
 * ou reset de senha). O valor "cru" é o que vai no cookie/link enviado
 * por e-mail — NUNCA é guardado assim no banco.
 */
export function generateRawToken(): string {
    return randomBytes(32).toString("base64url");
}

/**
 * Hash determinístico (sha256) do token, usado como chave primária nas
 * tabelas de sessão/verificação/reset. Se o banco vazar, os tokens em
 * si não são recuperáveis a partir do hash.
 */
export function hashToken(rawToken: string): string {
    return createHash("sha256").update(rawToken).digest("hex");
}
