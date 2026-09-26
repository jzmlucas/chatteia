import { cookies } from "next/headers";
import type { NextResponse } from "next/server";

import { pool } from "@/lib/db/pool";
import {
    generateRawToken,
    hashToken,
} from "@/lib/auth/tokens";

import type { UserRow } from "@/types/user";

export const SESSION_COOKIE_NAME =
    "chatteia_session";

const SESSION_DURATION_MS =
    1000 * 60 * 60 * 24 * 30;

export type SessionValidationResult =
    | {
        user: UserRow;
    }
    | {
        user: null;
    };

export async function createSession(
    userId: string
): Promise<{
    rawToken: string;
    expiresAt: Date;
}> {
    const rawToken =
        generateRawToken();

    const tokenHash =
        hashToken(rawToken);

    const expiresAt =
        new Date(
            Date.now() +
            SESSION_DURATION_MS
        );

    await pool.query(
        `
        INSERT INTO sessions (
            token_hash,
            user_id,
            expires_at
        )
        VALUES ($1, $2, $3)
        `,
        [
            tokenHash,
            userId,
            expiresAt,
        ]
    );

    return {
        rawToken,
        expiresAt,
    };
}

export async function validateSessionToken(
    rawToken: string
): Promise<SessionValidationResult> {
    const tokenHash =
        hashToken(rawToken);

    const { rows } =
        await pool.query<{
            user_id: string;
            expires_at: string;
        }>(
            `
            SELECT
                user_id,
                expires_at
            FROM sessions
            WHERE token_hash = $1
            LIMIT 1
            `,
            [tokenHash]
        );

    const session =
        rows[0];

    if (!session) {
        return {
            user: null,
        };
    }

    const expiresAt =
        new Date(
            session.expires_at
        );

    if (
        expiresAt.getTime() <=
        Date.now()
    ) {
        await pool.query(
            `
            DELETE FROM sessions
            WHERE token_hash = $1
            `,
            [tokenHash]
        );

        return {
            user: null,
        };
    }

    const { rows: userRows } =
        await pool.query<UserRow>(
            `
            SELECT *
            FROM users
            WHERE id = $1
            LIMIT 1
            `,
            [session.user_id]
        );

    const user =
        userRows[0];

    if (!user) {
        return {
            user: null,
        };
    }

    return {
        user,
    };
}

export async function invalidateSessionToken(
    rawToken: string
): Promise<void> {
    await pool.query(
        `
        DELETE FROM sessions
        WHERE token_hash = $1
        `,
        [hashToken(rawToken)]
    );
}

export async function invalidateAllUserSessions(
    userId: string
): Promise<void> {
    await pool.query(
        `
        DELETE FROM sessions
        WHERE user_id = $1
        `,
        [userId]
    );
}

export function setSessionCookieOnResponse(
    response: NextResponse,
    rawToken: string,
    expiresAt: Date
) {
    response.cookies.set(
        SESSION_COOKIE_NAME,
        rawToken,
        {
            httpOnly: true,
            sameSite: "lax",
            path: "/",
            secure:
                process.env.NODE_ENV ===
                "production",
            expires: expiresAt,
        }
    );
}

export function clearSessionCookieOnResponse(
    response: NextResponse
) {
    response.cookies.set(
        SESSION_COOKIE_NAME,
        "",
        {
            httpOnly: true,
            sameSite: "lax",
            path: "/",
            maxAge: 0,
        }
    );
}

export async function readSessionCookie(): Promise<string | null> {
    const store =
        await cookies();

    return (
        store.get(
            SESSION_COOKIE_NAME
        )?.value ?? null
    );
}
