import { NextResponse } from "next/server";

import {
    clearSessionCookieOnResponse,
    invalidateSessionToken,
    readSessionCookie,
} from "@/lib/auth/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST() {
    const token = await readSessionCookie();

    if (token) {
        await invalidateSessionToken(token);
    }

    const response = NextResponse.json({ ok: true });

    clearSessionCookieOnResponse(response);

    return response;
}
