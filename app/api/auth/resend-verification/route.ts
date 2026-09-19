import { NextRequest, NextResponse } from "next/server";

import { generateRawToken, hashToken } from "@/lib/auth/tokens";
import { findUserByEmail } from "@/lib/auth/users";
import { pool } from "@/lib/db/pool";
import { sendEmail } from "@/lib/email/sendEmail";
import { verificationEmail } from "@/lib/email/templates";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const EMAIL_VERIFICATION_TTL_MS = 1000 * 60 * 60 * 24;

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

    // Sempre responde "ok" — não revela se o e-mail existe ou já foi
    // confirmado, pra não virar uma forma de enumerar contas.
    if (!user || user.email_verified_at) {
        return NextResponse.json({ ok: true });
    }

    const rawToken = generateRawToken();

    await pool.query(
        "insert into email_verification_tokens (token_hash, user_id, expires_at) values ($1, $2, $3)",
        [
            hashToken(rawToken),
            user.id,
            new Date(Date.now() + EMAIL_VERIFICATION_TTL_MS),
        ]
    );

    const appUrl = new URL(request.url).origin;
    const link = `${appUrl}/api/auth/verify-email?token=${rawToken}`;

    const { subject, html, text } = verificationEmail(link);

    await sendEmail({ to: email, subject, html, text });

    return NextResponse.json({ ok: true });
}
