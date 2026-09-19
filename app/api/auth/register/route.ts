import { NextRequest, NextResponse } from "next/server";

import { hashPassword } from "@/lib/auth/password";

import {
    createUser,
    findUserByEmail,
    findUserByUsername,
} from "@/lib/auth/users";

import type { AccountType } from "@/types/user";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const USERNAME_REGEX = /^[a-zA-Z0-9_]{3,20}$/;

export async function POST(request: NextRequest) {
    let body: {
        email?: string;
        username?: string;
        password?: string;
        accountType?: AccountType;
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
    const username = (body.username ?? "").trim();
    const password = body.password ?? "";

    const accountType: AccountType =
        body.accountType === "streamer"
            ? "streamer"
            : "user";

    if (!email || !username || !password) {
        return NextResponse.json(
            { error: "REQUIRED_FIELDS" },
            { status: 400 }
        );
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return NextResponse.json(
            { error: "INVALID_EMAIL" },
            { status: 400 }
        );
    }

    if (!USERNAME_REGEX.test(username)) {
        return NextResponse.json(
            { error: "INVALID_USERNAME" },
            { status: 400 }
        );
    }

    if (password.length < 6) {
        return NextResponse.json(
            { error: "WEAK_PASSWORD" },
            { status: 400 }
        );
    }

    const existingEmail = await findUserByEmail(email);

    if (existingEmail) {
        return NextResponse.json(
            { error: "EMAIL_TAKEN" },
            { status: 409 }
        );
    }

    const existingUsername = await findUserByUsername(username);

    if (existingUsername) {
        return NextResponse.json(
            { error: "USERNAME_TAKEN" },
            { status: 409 }
        );
    }

    const passwordHash = await hashPassword(password);

    const user = await createUser({
        email,
        username,
        passwordHash,
        accountType,
    });

    return NextResponse.json(
        {
            ok: true,
            user: {
                id: user.id,
                email: user.email,
                username: user.username,
                display_name: user.display_name,
                account_type: user.account_type,
                active_mode: user.active_mode,
                avatar_url: user.avatar_url,
                bio: user.bio,
            },
        },
        { status: 201 }
    );
}