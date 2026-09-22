import { NextRequest, NextResponse } from "next/server";

import { getSessionUser } from "@/lib/auth/getSessionUser";
import { findUserById } from "@/lib/auth/users";
import { hasStreamerAccess } from "@/lib/billing/entitlements";
import { findSubscriptionByUserId } from "@/lib/billing/subscriptions";
import { giveawayRepo } from "@/lib/repositories/giveaways";
import { toGiveawaySummary } from "@/types/giveaway";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function fail(error: string, status: number) {
    return NextResponse.json({ error }, { status });
}

/**
 * Abre ou fecha o recebimento de entradas do sorteio já configurado.
 *
 * "open"/"closed" mudam só o status; escolher o vencedor é responsabilidade
 * do listener de chat (ainda não implementado — ver TODO no README da
 * feature) que escuta a trigger nos canais listados enquanto status="open"
 * e grava o resultado via `giveawayRepo.updateStatus(userId, "closed", winner)`.
 */
export async function PATCH(request: NextRequest) {
    const sessionUser = await getSessionUser(request);

    if (!sessionUser) {
        return fail("UNAUTHENTICATED", 401);
    }

    const user = await findUserById(sessionUser.id);

    if (!user || user.account_type !== "streamer") {
        return fail("NOT_A_STREAMER_ACCOUNT", 403);
    }

    if (!hasStreamerAccess(await findSubscriptionByUserId(user.id))) {
        return fail("SUBSCRIPTION_REQUIRED", 402);
    }

    let body: { status?: unknown };

    try {
        body = await request.json();
    } catch {
        return fail("INVALID_JSON", 400);
    }

    if (body.status !== "open" && body.status !== "closed") {
        return fail("INVALID_STATUS", 400);
    }

    const existing = await giveawayRepo.findByOwner(user.id);

    if (!existing) {
        return fail("GIVEAWAY_NOT_CONFIGURED", 404);
    }

    if (body.status === "open" && existing.channels.length === 0) {
        return fail("EMPTY_CHANNELS", 400);
    }

    const updated = await giveawayRepo.updateStatus(user.id, body.status);

    if (!updated) {
        return fail("GIVEAWAY_NOT_CONFIGURED", 404);
    }

    return NextResponse.json({ giveaway: toGiveawaySummary(updated) });
}
