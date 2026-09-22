import { NextRequest, NextResponse } from "next/server";

import { getSessionUser } from "@/lib/auth/getSessionUser";
import { findUserById } from "@/lib/auth/users";

import { hasStreamerAccess } from "./entitlements";
import { findSubscriptionByUserId } from "./subscriptions";

export type StreamerAccessResult =
    | { userId: string }
    | { error: NextResponse };

function fail(error: string, status: number): NextResponse {
    return NextResponse.json({ error }, { status });
}

/**
 * Confere sessão + conta streamer + direito de uso (mesma regra usada em
 * /api/auth/profile e no gate visual de /profile). Usada por toda rota de
 * API que serve uma feature exclusiva do modo streamer (sorteios, links de
 * overlay, etc.) — centralizar aqui evita que cada endpoint novo reimplemente
 * (e eventualmente erre) essa checagem.
 */
export async function requireStreamerAccess(
    request: NextRequest
): Promise<StreamerAccessResult> {
    const sessionUser = await getSessionUser(request);

    if (!sessionUser) {
        return { error: fail("UNAUTHENTICATED", 401) };
    }

    const user = await findUserById(sessionUser.id);

    if (!user) {
        return { error: fail("UNAUTHENTICATED", 401) };
    }

    if (user.account_type !== "streamer") {
        return { error: fail("NOT_A_STREAMER_ACCOUNT", 403) };
    }

    const entitled = hasStreamerAccess(
        await findSubscriptionByUserId(user.id)
    );

    if (!entitled) {
        return { error: fail("SUBSCRIPTION_REQUIRED", 402) };
    }

    return { userId: user.id };
}
