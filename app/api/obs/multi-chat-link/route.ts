import { NextRequest, NextResponse } from "next/server";

import { generateRawToken, hashToken } from "@/lib/auth/tokens";
import { requireStreamerAccess } from "@/lib/billing/requireStreamerAccess";
import { normalizeChatTarget, type ChatTarget } from "@/lib/chat/targets";
import { obsLinkRepo } from "@/lib/repositories/obsLinks";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Mesmo teto de canais do multi-chat na tela normal (ver
// errorMaxChannels em messages/*.json — "multiChat.errorMaxChannels").
const MAX_OBS_MULTI_CHAT_CHANNELS = 4;

function fail(error: string, status: number) {
    return NextResponse.json({ error }, { status });
}

/**
 * Gera (ou substitui) o link assinado do overlay multi-chat.
 *
 * Requer sessão + plano streamer — mesma regra de qualquer outra feature
 * paga. O token cru só é devolvido aqui, uma vez; o banco só guarda o hash
 * (mesmo padrão de `sessions`, ver lib/auth/tokens.ts). Gerar de novo
 * invalida qualquer link anterior automaticamente (útil se o link vazar).
 */
export async function POST(request: NextRequest) {
    const access = await requireStreamerAccess(request);

    if ("error" in access) {
        return access.error;
    }

    let body: { channels?: unknown };

    try {
        body = await request.json();
    } catch {
        return fail("INVALID_JSON", 400);
    }

    if (!Array.isArray(body.channels) || body.channels.length === 0) {
        return fail("EMPTY_CHANNELS", 400);
    }

    if (body.channels.length > MAX_OBS_MULTI_CHAT_CHANNELS) {
        return fail("TOO_MANY_CHANNELS", 400);
    }

    const channels: ChatTarget[] = [];
    const seen = new Set<string>();

    for (const raw of body.channels) {
        if (typeof raw !== "string") {
            return fail("INVALID_CHANNELS", 400);
        }

        // Mesma validação usada ao adicionar um canal no multi-chat da UI
        // (lib/chat/targets.ts) — nenhuma entrada nova de formato aqui.
        const target = normalizeChatTarget(raw);

        if (!target) {
            return fail("INVALID_CHANNELS", 400);
        }

        const key = `${target.platform}:${target.channel}`;

        if (seen.has(key)) {
            continue;
        }

        seen.add(key);
        channels.push(target);
    }

    if (channels.length === 0) {
        return fail("EMPTY_CHANNELS", 400);
    }

    const rawToken = generateRawToken();

    await obsLinkRepo.rotate(access.userId, hashToken(rawToken), channels);

    return NextResponse.json({ token: rawToken });
}

/**
 * Resolve um token em lista de canais. Chamado pelo overlay dentro do OBS —
 * de propósito SEM checar sessão (o OBS não tem cookie de login): a
 * segurança vem inteira de o token ser um segredo de 256 bits imprevisível,
 * nunca de saber quem está pedindo.
 */
export async function GET(request: NextRequest) {
    const token = request.nextUrl.searchParams.get("token")?.trim();

    if (!token) {
        return fail("MISSING_TOKEN", 400);
    }

    const link = await obsLinkRepo.findByTokenHash(hashToken(token));

    if (!link) {
        return fail("INVALID_TOKEN", 404);
    }

    return NextResponse.json({ channels: link.channels });
}
