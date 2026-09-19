import { NextRequest, NextResponse } from "next/server";

import { generateRawToken, hashToken } from "@/lib/auth/tokens";
import { findUserByEmail } from "@/lib/auth/users";
import { pool } from "@/lib/db/pool";
import { sendEmail } from "@/lib/email/sendEmail";
import { passwordResetEmail } from "@/lib/email/templates";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const RESET_TTL_MS = 1000 * 60 * 60; // 1h

export async function POST(request: NextRequest) {
    let body: { email?: string };

    try {
        body = await request.json();
    } catch {
        return NextResponse.json({ error: "INVALID_JSON" }, { status: 400 });
    }

    const email = (body.email ?? "").trim().toLowerCase();

    if (!email) {
        return NextResponse.json(
            { error: "REQUIRED_FIELDS" },
            { status: 400 }
        );
    }

    const user = await findUserByEmail(email);

    // Sempre "ok", exista ou não a conta — evita enumeração de e-mails.
    if (!user) {
        return NextResponse.json({ ok: true });
    }

    const rawToken = generateRawToken();

    await pool.query(
        "insert into password_reset_tokens (token_hash, user_id, expires_at) values ($1, $2, $3)",
        [hashToken(rawToken), user.id, new Date(Date.now() + RESET_TTL_MS)]
    );

    const appUrl = new URL(request.url).origin;
    const link = `${appUrl}/reset-password?token=${rawToken}`;

    const { subject, html, text } = passwordResetEmail(link);

    await sendEmail({ to: email, subject, html, text });

    return NextResponse.json({ ok: true });
}
