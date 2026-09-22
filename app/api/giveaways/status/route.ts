import { NextRequest, NextResponse } from "next/server";

import { requireStreamerAccess } from "@/lib/billing/requireStreamerAccess";
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
    const access = await requireStreamerAccess(request);

    if ("error" in access) {
        return access.error;
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

    const existing = await giveawayRepo.findByOwner(access.userId);

    if (!existing) {
        return fail("GIVEAWAY_NOT_CONFIGURED", 404);
    }

    if (body.status === "open" && existing.channels.length === 0) {
        return fail("EMPTY_CHANNELS", 400);
    }

    const updated = await giveawayRepo.updateStatus(access.userId, body.status);

    if (!updated) {
        return fail("GIVEAWAY_NOT_CONFIGURED", 404);
    }

    return NextResponse.json({ giveaway: toGiveawaySummary(updated) });
}
