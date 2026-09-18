import { NextRequest } from "next/server";
import { createClient } from "@supabase/supabase-js";

/*
 * ============================================================================
 * getSessionUser
 * ============================================================================
 *
 * O Chatteia usa `@supabase/supabase-js` puro no browser (não `@supabase/ssr`),
 * então a sessão fica no localStorage — não existe cookie de sessão nativo do
 * Supabase para o servidor ler.
 *
 * Este helper resolve o usuário autenticado a partir de DUAS origens
 * possíveis, na seguinte ordem:
 *
 *   1. Header `Authorization: Bearer <access_token>` — usado pelos fetch()
 *      feitos no client (ex: components/account/PlatformConnections.tsx).
 *   2. Cookie httpOnly `chatteia_session` — gravado por /api/session/sync
 *      sempre que a sessão do Supabase muda. É esse cookie que permite
 *      identificar o usuário em navegações de página inteira (sem fetch),
 *      como o fluxo OAuth do Kick (authorize -> Kick -> callback).
 *
 * Em ambos os casos o valor é o próprio access_token do Supabase, validado
 * aqui via `supabase.auth.getUser(accessToken)` — nunca confiamos num id
 * de usuário "cru" vindo do cliente.
 */

export type SessionUser = {
    id: string;
    email: string | null;
};

const SESSION_COOKIE_NAME = "chatteia_session";

function extractAccessToken(request: NextRequest): string | null {
    const authHeader = request.headers.get("authorization") ?? "";
    const bearerMatch = authHeader.match(/^Bearer (.+)$/i);

    if (bearerMatch?.[1]) {
        return bearerMatch[1];
    }

    const cookieToken = request.cookies.get(SESSION_COOKIE_NAME)?.value;
    return cookieToken ?? null;
}

/**
 * Resolve o usuário autenticado do Chatteia (Supabase) a partir do header
 * Authorization ou do cookie de sessão da request. Retorna `null` se não
 * houver sessão válida.
 */
export async function getSessionUser(
    request: NextRequest
): Promise<SessionUser | null> {
    const accessToken = extractAccessToken(request);

    if (!accessToken) {
        return null;
    }

    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseSecretKey = process.env.SUPABASE_SECRET_KEY;

    if (!supabaseUrl || !supabaseSecretKey) {
        console.error(
            "[getSessionUser] SUPABASE_URL/SUPABASE_SECRET_KEY não configurados."
        );
        return null;
    }

    const supabase = createClient(supabaseUrl, supabaseSecretKey, {
        auth: { autoRefreshToken: false, persistSession: false },
    });

    const { data, error } = await supabase.auth.getUser(accessToken);

    if (error || !data.user) {
        return null;
    }

    return {
        id: data.user.id,
        email: data.user.email ?? null,
    };
}
