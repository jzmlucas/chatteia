import { NextRequest } from "next/server";

import { validateSessionToken } from "@/lib/auth/session";

/*
 * ============================================================================
 * getSessionUser
 * ============================================================================
 *
 * Mesma assinatura de antes (quando validava contra o Supabase Auth) —
 * por isso nenhum dos consumidores desta função precisou mudar.
 *
 * Agora a sessão é 100% nossa: o cookie `chatteia_session` guarda um
 * token opaco, validado direto contra a tabela `sessions` no Postgres
 * (sem chamada de rede para nenhum serviço externo).
 */

export type SessionUser = {
    id: string;
    email: string | null;
};

const SESSION_COOKIE_NAME = "chatteia_session";

function extractSessionToken(request: NextRequest): string | null {
    // Mantido por compatibilidade: aceita tanto o cookie httpOnly
    // (navegação normal) quanto um header Authorization: Bearer
    // (útil para chamadas server-to-server / testes com curl).
    const authHeader = request.headers.get("authorization") ?? "";
    const bearerMatch = authHeader.match(/^Bearer (.+)$/i);

    if (bearerMatch?.[1]) {
        return bearerMatch[1];
    }

    return request.cookies.get(SESSION_COOKIE_NAME)?.value ?? null;
}

export async function getSessionUser(
    request: NextRequest
): Promise<SessionUser | null> {
    const token = extractSessionToken(request);

    if (!token) {
        return null;
    }

    const { user } = await validateSessionToken(token);

    if (!user) {
        return null;
    }

    return {
        id: user.id,
        email: user.email,
    };
}
