import { NextRequest, NextResponse } from "next/server";

import { hashToken } from "@/lib/auth/tokens";
import { markEmailVerified } from "@/lib/auth/users";
import { pool } from "@/lib/db/pool";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
    const token = new URL(request.url).searchParams.get("token");
    const appUrl = new URL(request.url).origin;

    if (!token) {
        return NextResponse.redirect(`${appUrl}/login?verified=0`);
    }

    const tokenHash = hashToken(token);

    const { rows } = await pool.query<{ user_id: string; expires_at: string }>(
        "select user_id, expires_at from email_verification_tokens where token_hash = $1",
        [tokenHash]
    );

    const record = rows[0];

    if (!record || new Date(record.expires_at).getTime() < Date.now()) {
        return NextResponse.redirect(`${appUrl}/login?verified=0`);
    }

    await markEmailVerified(record.user_id);

    await pool.query(
        "delete from email_verification_tokens where token_hash = $1",
        [tokenHash]
    );

    return NextResponse.redirect(`${appUrl}/login?verified=1`);
}
