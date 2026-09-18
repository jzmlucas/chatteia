import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

/*
 * ============================================================================
 * /api/session/sync
 * ============================================================================
 *
 * O projeto usa `@supabase/supabase-js` puro no browser (não `@supabase/ssr`),
 * então a sessão do usuário vive no localStorage — o servidor nunca recebe
 * um cookie de sessão automaticamente.
 *
 * Essa rota é chamada pelo AuthContext sempre que a sessão muda. Ela recebe
 * o access_token no header Authorization, VALIDA contra o Supabase (não
 * confia só no valor recebido) e, se for válido, grava esse mesmo token num
 * cookie httpOnly de primeira parte (`chatteia_session`).
 *
 * Esse cookie passa a ser a forma do backend identificar o usuário logado em:
 *   - rotas de API chamadas via fetch (connections, disconnect)
 *   - navegações "cruas" de página inteira, como o fluxo OAuth do Kick
 *     (authorize -> Kick -> callback), onde não é possível anexar um header
 *     Authorization.
 *
 * POST com Authorization: Bearer <access_token>  -> grava o cookie
 * DELETE                                          -> limpa o cookie (logout)
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const COOKIE_NAME = "chatteia_session";

function getBearerToken(request: NextRequest): string | null {
    const header = request.headers.get("authorization") ?? "";
    const match = header.match(/^Bearer (.+)$/i);
    return match?.[1] ?? null;
}

export async function POST(request: NextRequest) {
    const accessToken = getBearerToken(request);

    if (!accessToken) {
        return NextResponse.json(
            { error: "Token de acesso ausente." },
            { status: 400 }
        );
    }

    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseSecretKey = process.env.SUPABASE_SECRET_KEY;

    if (!supabaseUrl || !supabaseSecretKey) {
        console.error(
            "[session/sync] SUPABASE_URL/SUPABASE_SECRET_KEY não configurados."
        );
        return NextResponse.json(
            { error: "Erro interno do servidor" },
            { status: 500 }
        );
    }

    const supabase = createClient(supabaseUrl, supabaseSecretKey, {
        auth: { autoRefreshToken: false, persistSession: false },
    });

    // Só grava o cookie se o token realmente for válido.
    const { data, error } = await supabase.auth.getUser(accessToken);

    if (error || !data.user) {
        return NextResponse.json(
            { error: "Sessão inválida." },
            { status: 401 }
        );
    }

    const response = NextResponse.json({ ok: true });

    response.cookies.set(COOKIE_NAME, accessToken, {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: process.env.NODE_ENV === "production",
        // Um pouco menor que a validade padrão do access_token do Supabase (1h),
        // só para não segurar um cookie morto por muito tempo.
        maxAge: 60 * 55,
    });

    return response;
}

export async function DELETE() {
    const response = NextResponse.json({ ok: true });

    response.cookies.set(COOKIE_NAME, "", {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        maxAge: 0,
    });

    return response;
}
