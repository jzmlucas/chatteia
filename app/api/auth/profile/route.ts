import { NextRequest, NextResponse } from "next/server";

import {
    readSessionCookie,
    validateSessionToken,
} from "@/lib/auth/session";

import {
    enableStreamerMode,
    setActiveMode,
    updateProfile,
} from "@/lib/auth/users";

import {
    toProfile,
    type ActiveMode,
} from "@/types/user";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function requireUser() {
    const token = await readSessionCookie();

    if (!token) {
        return null;
    }

    const { user } =
        await validateSessionToken(token);

    return user;
}

export async function PATCH(
    request: NextRequest
) {
    try {
        const user = await requireUser();

        if (!user) {
            return NextResponse.json(
                {
                    error: "UNAUTHENTICATED",
                },
                {
                    status: 401,
                }
            );
        }

        let body: {
            display_name?: string | null;
            bio?: string | null;
            avatar_url?: string | null;
            active_mode?: ActiveMode;
            enable_streamer_mode?: boolean;
        };

        try {
            body = await request.json();
        } catch {
            return NextResponse.json(
                {
                    error: "INVALID_JSON",
                },
                {
                    status: 400,
                }
            );
        }

        if (body.enable_streamer_mode) {
            const updated =
                await enableStreamerMode(
                    user.id
                );

            if (!updated) {
                return NextResponse.json(
                    {
                        error:
                            "PROFILE_NOT_FOUND",
                    },
                    {
                        status: 404,
                    }
                );
            }

            return NextResponse.json({
                ok: true,
                profile: toProfile(updated),
            });
        }

        if (body.active_mode) {
            if (
                body.active_mode ===
                "streamer" &&
                user.account_type !==
                "streamer"
            ) {
                return NextResponse.json(
                    {
                        error:
                            "NOT_A_STREAMER_ACCOUNT",
                    },
                    {
                        status: 403,
                    }
                );
            }

            const updated =
                await setActiveMode(
                    user.id,
                    body.active_mode
                );

            if (!updated) {
                return NextResponse.json(
                    {
                        error:
                            "PROFILE_NOT_FOUND",
                    },
                    {
                        status: 404,
                    }
                );
            }

            return NextResponse.json({
                ok: true,
                profile: toProfile(updated),
            });
        }

        const fields: {
            display_name?: string | null;
            bio?: string | null;
            avatar_url?: string | null;
        } = {};

        if (
            Object.prototype.hasOwnProperty.call(
                body,
                "display_name"
            )
        ) {
            fields.display_name =
                typeof body.display_name ===
                "string"
                    ? body.display_name.trim()
                    : null;
        }

        if (
            Object.prototype.hasOwnProperty.call(
                body,
                "bio"
            )
        ) {
            fields.bio =
                typeof body.bio ===
                "string"
                    ? body.bio.trim()
                    : null;
        }

        if (
            Object.prototype.hasOwnProperty.call(
                body,
                "avatar_url"
            )
        ) {
            fields.avatar_url =
                typeof body.avatar_url ===
                "string"
                    ? body.avatar_url.trim()
                    : null;
        }

        if (
            Object.keys(fields).length ===
            0
        ) {
            return NextResponse.json({
                ok: true,
                profile: toProfile(user),
            });
        }

        const updated =
            await updateProfile(
                user.id,
                fields
            );

        if (!updated) {
            return NextResponse.json(
                {
                    error:
                        "PROFILE_NOT_FOUND",
                },
                {
                    status: 404,
                }
            );
        }

        return NextResponse.json({
            ok: true,
            profile: toProfile(updated),
        });
    } catch (error) {
        console.error(
            "[AUTH PROFILE] Erro ao atualizar perfil:",
            error
        );

        return NextResponse.json(
            {
                error: "PROFILE_UPDATE_FAILED",
            },
            {
                status: 500,
            }
        );
    }
}