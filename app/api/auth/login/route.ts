import { NextRequest, NextResponse } from "next/server";

import { verifyPassword } from "@/lib/auth/password";
import {
    createSession,
    setSessionCookieOnResponse,
} from "@/lib/auth/session";
import { findUserByEmail } from "@/lib/auth/users";
import { toProfile } from "@/types/user";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
    let body: {
        email?: string;
        password?: string;
    };

    try {
        body = await request.json();
    } catch {
        return NextResponse.json(
            { error: "INVALID_JSON" },
            { status: 400 }
        );
    }

    const email = (body.email ?? "").trim().toLowerCase();
    const password = body.password ?? "";

    if (!email || !password) {
        return NextResponse.json(
            { error: "REQUIRED_FIELDS" },
            { status: 400 }
        );
    }

    const user = await findUserByEmail(email);

    if (!user || !user.password_hash) {
        return NextResponse.json(
            { error: "INVALID_CREDENTIALS" },
            { status: 401 }
        );
    }

    const validPassword = await verifyPassword(
        password,
        user.password_hash
    );

    if (!validPassword) {
        return NextResponse.json(
            { error: "INVALID_CREDENTIALS" },
            { status: 401 }
        );
    }

    const { rawToken, expiresAt } =
        await createSession(user.id);

    const response = NextResponse.json({
        ok: true,
        profile: toProfile(user),
    });

    setSessionCookieOnResponse(
        response,
        rawToken,
        expiresAt
    );

    return response;
}