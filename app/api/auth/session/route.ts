import { NextResponse } from "next/server";

import { readSessionCookie, validateSessionToken } from "@/lib/auth/session";
import { toProfile } from "@/types/user";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
    const token = await readSessionCookie();

    if (!token) {
        return NextResponse.json({ profile: null });
    }

    const { user } = await validateSessionToken(token);

    if (!user) {
        return NextResponse.json({ profile: null });
    }

    return NextResponse.json({ profile: toProfile(user) });
}
