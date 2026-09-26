import { NextRequest, NextResponse } from "next/server";

import { giveawayRepo } from "@/lib/repositories/giveaways";
import { isChatPlatform, toGiveawaySummary } from "@/types/giveaway";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function normalize(value: string) {
    return value.trim().toLowerCase().replace(/^!+/, "");
}

export async function POST(request: NextRequest) {
    let body: Record<string, unknown>;

    try {
        body = await request.json();
    } catch {
        return NextResponse.json({ error: "INVALID_JSON" }, { status: 400 });
    }

    const platform = body.platform;
    const channelName = typeof body.channelName === "string" ? body.channelName.trim() : "";
    const username = typeof body.username === "string" ? body.username.trim() : "";
    const displayName = typeof body.displayName === "string" ? body.displayName.trim() : username;
    const message = typeof body.message === "string" ? body.message.trim() : "";

    if (!isChatPlatform(platform) || !channelName || !username || !message) {
        return NextResponse.json({ error: "INVALID_ENTRY" }, { status: 400 });
    }

    try {
        const giveaways = await giveawayRepo.findOpenByChannel(platform, channelName);
        const command = normalize(message).split(/\s+/)[0];
        const matching = giveaways.filter((giveaway) => normalize(giveaway.trigger) === command);

        if (matching.length === 0) {
            return NextResponse.json({ accepted: false });
        }

        const updated = await giveawayRepo.addParticipant({
            giveaway: matching[0],
            username: username.slice(0, 64),
            displayName: displayName.slice(0, 100) || username.slice(0, 64),
            platform,
            channelName: channelName.slice(0, 64),
        });

        return NextResponse.json({
            accepted: Boolean(updated),
            giveaway: updated ? toGiveawaySummary(updated) : null,
        }, { headers: { "Cache-Control": "no-store" } });
    } catch (error) {
        console.error("[GIVEAWAY ENTRY] Falha ao registrar participante:", error);
        return NextResponse.json({ error: "ENTRY_UNAVAILABLE" }, { status: 503 });
    }
}
