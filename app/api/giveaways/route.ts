import { NextRequest, NextResponse } from "next/server";

import { requireStreamerAccess } from "@/lib/billing/requireStreamerAccess";
import { giveawayRepo } from "@/lib/repositories/giveaways";
import {
    GIVEAWAY_CHANNEL_NAME_MAX_LENGTH,
    GIVEAWAY_TRIGGER_MAX_LENGTH,
    MAX_GIVEAWAY_CHANNELS,
    isChatPlatform,
    toGiveawaySummary,
    type GiveawayChannel,
} from "@/types/giveaway";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function fail(error: string, status: number) {
    return NextResponse.json({ error }, { status });
}

export async function GET(request: NextRequest) {
    const access = await requireStreamerAccess(request);

    if ("error" in access) {
        return access.error;
    }

    const row = await giveawayRepo.findByOwner(access.userId);

    return NextResponse.json({
        maxChannels: MAX_GIVEAWAY_CHANNELS,
        giveaway: row ? toGiveawaySummary(row) : null,
    });
}

/**
 * Cria/atualiza a configuração do sorteio (trigger + canais participantes).
 * Salvar sempre volta o sorteio para "draft" (ver repositório): mudar a lista
 * de canais com o sorteio aberto poderia deixar entradas já contadas
 * associadas a um canal que acabou de ser removido.
 */
export async function PUT(request: NextRequest) {
    const access = await requireStreamerAccess(request);

    if ("error" in access) {
        return access.error;
    }

    let body: { trigger?: unknown; channels?: unknown };

    try {
        body = await request.json();
    } catch {
        return fail("INVALID_JSON", 400);
    }

    const trigger =
        typeof body.trigger === "string" ? body.trigger.trim() : "";

    if (!trigger || !trigger.startsWith("!") || trigger.length > GIVEAWAY_TRIGGER_MAX_LENGTH) {
        return fail("INVALID_TRIGGER", 400);
    }

    if (!Array.isArray(body.channels)) {
        return fail("INVALID_CHANNELS", 400);
    }

    if (body.channels.length === 0) {
        return fail("EMPTY_CHANNELS", 400);
    }

    if (body.channels.length > MAX_GIVEAWAY_CHANNELS) {
        return fail("TOO_MANY_CHANNELS", 400);
    }

    const channels: GiveawayChannel[] = [];
    const seen = new Set<string>();

    for (const raw of body.channels) {
        if (typeof raw !== "object" || raw === null) {
            return fail("INVALID_CHANNELS", 400);
        }

        const { platform, channelName } = raw as Record<string, unknown>;

        if (!isChatPlatform(platform)) {
            return fail("INVALID_PLATFORM", 400);
        }

        const name =
            typeof channelName === "string" ? channelName.trim() : "";

        if (!name || name.length > GIVEAWAY_CHANNEL_NAME_MAX_LENGTH) {
            return fail("INVALID_CHANNEL_NAME", 400);
        }

        // Dedupe por plataforma+canal (mesmo canal duas vezes não faz
        // sentido e dobraria as chances dele no sorteio).
        const key = `${platform}:${name.toLowerCase()}`;

        if (seen.has(key)) {
            return fail("DUPLICATE_CHANNEL", 400);
        }

        seen.add(key);
        channels.push({ platform, channelName: name });
    }

    const row = await giveawayRepo.upsert(access.userId, {
        trigger,
        channels,
    });

    return NextResponse.json({
        maxChannels: MAX_GIVEAWAY_CHANNELS,
        giveaway: toGiveawaySummary(row),
    });
}

export async function DELETE(request: NextRequest) {
    const access = await requireStreamerAccess(request);

    if ("error" in access) {
        return access.error;
    }

    await giveawayRepo.delete(access.userId);

    return NextResponse.json({ ok: true });
}
