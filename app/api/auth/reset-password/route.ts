import { NextRequest, NextResponse } from "next/server";

import { hashPassword } from "@/lib/auth/password";
import { invalidateAllUserSessions } from "@/lib/auth/session";
import { hashToken } from "@/lib/auth/tokens";
import { updatePasswordHash } from "@/lib/auth/users";
import { pool } from "@/lib/db/pool";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
    let body: { token?: string; password?: string };

    try {
        body = await request.json();
    } catch {
        return NextResponse.json({ error: "INVALID_JSON" }, { status: 400 });
    }

    const token = body.token ?? "";
    const password = body.password ?? "";

    if (!token || !password) {
        return NextResponse.json(
            { error: "REQUIRED_FIELDS" },
            { status: 400 }
        );
    }

    if (password.length < 6) {
        return NextResponse.json(
            { error: "WEAK_PASSWORD" },
            { status: 400 }
        );
    }

    const tokenHash = hashToken(token);

    const { rows } = await pool.query<{
        user_id: string;
        expires_at: string;
    }>(
        "select user_id, expires_at from password_reset_tokens where token_hash = $1",
        [tokenHash]
    );

    const record = rows[0];

    if (!record || new Date(record.expires_at).getTime() < Date.now()) {
        return NextResponse.json(
            { error: "INVALID_OR_EXPIRED_TOKEN" },
            { status: 400 }
        );
    }

    const passwordHash = await hashPassword(password);

    await updatePasswordHash(record.user_id, passwordHash);

    await pool.query(
        "delete from password_reset_tokens where token_hash = $1",
        [tokenHash]
    );

    // Reset de senha invalida todas as sessões existentes — se alguém
    // mais tinha acesso à conta, perde a sessão ativa agora.
    await invalidateAllUserSessions(record.user_id);

    return NextResponse.json({ ok: true });
}
