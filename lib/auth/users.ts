import { pool } from "@/lib/db/pool";

import type {
    AccountType,
    ActiveMode,
    UserRow,
} from "@/types/user";

function mapUserRow(
    row: UserRow
): UserRow {
    return row;
}

export async function findUserByEmail(
    email: string
): Promise<UserRow | null> {
    const { rows } = await pool.query<UserRow>(
        `
        SELECT
            *
        FROM users
        WHERE lower(email) = lower($1)
        LIMIT 1
        `,
        [email]
    );

    return rows[0] ?? null;
}

export async function findUserByUsername(
    username: string
): Promise<UserRow | null> {
    const { rows } = await pool.query<UserRow>(
        `
        SELECT
            *
        FROM users
        WHERE lower(username) = lower($1)
        LIMIT 1
        `,
        [username]
    );

    return rows[0] ?? null;
}

export async function findUserById(
    id: string
): Promise<UserRow | null> {
    const { rows } = await pool.query<UserRow>(
        `
        SELECT
            *
        FROM users
        WHERE id = $1
        LIMIT 1
        `,
        [id]
    );

    return rows[0] ?? null;
}

export async function createUser(input: {
    email: string;
    username: string;
    passwordHash: string;
    displayName?: string | null;
    accountType?: AccountType;
}): Promise<UserRow> {
    const { rows } = await pool.query<UserRow>(
        `
        INSERT INTO users (
            email,
            username,
            password_hash,
            display_name,
            account_type,
            active_mode
        )
        VALUES (
            $1,
            $2,
            $3,
            $4,
            $5,
            'user'
        )
        RETURNING *
        `,
        [
            input.email,
            input.username,
            input.passwordHash,
            input.displayName ?? input.username,
            input.accountType ?? "user",
        ]
    );

    return mapUserRow(rows[0]);
}

export async function updatePasswordHash(
    userId: string,
    passwordHash: string
): Promise<void> {
    await pool.query(
        `
        UPDATE users
        SET
            password_hash = $2,
            updated_at = now()
        WHERE id = $1
        `,
        [
            userId,
            passwordHash,
        ]
    );
}

export async function updateProfile(
    userId: string,
    fields: {
        display_name?: string | null;
        bio?: string | null;
        avatar_url?: string | null;
    }
): Promise<UserRow | null> {
    const { rows } = await pool.query<UserRow>(
        `
        UPDATE users
        SET
            display_name = $2,
            bio = $3,
            avatar_url = $4,
            updated_at = now()
        WHERE id = $1
        RETURNING *
        `,
        [
            userId,
            fields.display_name ?? null,
            fields.bio ?? null,
            fields.avatar_url ?? null,
        ]
    );

    return rows[0] ?? null;
}

export async function setActiveMode(
    userId: string,
    mode: ActiveMode
): Promise<UserRow | null> {
    const { rows } = await pool.query<UserRow>(
        `
        UPDATE users
        SET
            active_mode = $2,
            updated_at = now()
        WHERE id = $1
        RETURNING *
        `,
        [
            userId,
            mode,
        ]
    );

    return rows[0] ?? null;
}

export async function enableStreamerMode(
    userId: string
): Promise<UserRow | null> {
    const { rows } = await pool.query<UserRow>(
        `
        UPDATE users
        SET
            account_type = 'streamer',
            active_mode = 'streamer',
            updated_at = now()
        WHERE id = $1
        RETURNING *
        `,
        [userId]
    );

    return rows[0] ?? null;
}

function normalizeOAuthUsername(
    value: string
): string {
    const normalized = value
        .normalize("NFKD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-zA-Z0-9_]/g, "")
        .replace(/^_+|_+$/g, "")
        .slice(0, 20);

    if (normalized.length >= 3) {
        return normalized;
    }

    return `user${normalized}`.slice(0, 20);
}

async function createUniqueOAuthUsername(
    suggestedUsername: string
): Promise<string> {
    const base =
        normalizeOAuthUsername(
            suggestedUsername
        );

    for (let attempt = 0; attempt < 100; attempt++) {
        let candidate = base;

        if (attempt > 0) {
            const suffix = String(attempt);

            candidate =
                `${base.slice(
                    0,
                    20 - suffix.length
                )}${suffix}`;
        }

        const existing =
            await findUserByUsername(
                candidate
            );

        if (!existing) {
            return candidate;
        }
    }

    throw new Error(
        "Não foi possível gerar um username único para a conta OAuth."
    );
}

export async function findOrCreateUserFromOAuth(
    input: {
        provider: string;
        providerAccountId: string;
        email: string;
        suggestedUsername: string;
        displayName?: string | null;
        avatarUrl?: string | null;
    }
): Promise<UserRow> {
    const client = await pool.connect();

    try {
        await client.query("BEGIN");

        const oauthResult =
            await client.query<UserRow>(
                `
                SELECT
                    u.*
                FROM oauth_accounts oa
                INNER JOIN users u
                    ON u.id = oa.user_id
                WHERE oa.provider = $1
                  AND oa.provider_account_id = $2
                LIMIT 1
                `,
                [
                    input.provider,
                    input.providerAccountId,
                ]
            );

        const existingOAuthUser =
            oauthResult.rows[0];

        if (existingOAuthUser) {
            await client.query(
                `
                UPDATE users
                SET
                    email_verified_at =
                        COALESCE(
                            email_verified_at,
                            now()
                        ),
                    updated_at = now()
                WHERE id = $1
                `,
                [existingOAuthUser.id]
            );

            await client.query("COMMIT");

            const user =
                await findUserById(
                    existingOAuthUser.id
                );

            if (!user) {
                throw new Error(
                    "Usuário OAuth não encontrado após atualização."
                );
            }

            return user;
        }

        const emailResult =
            await client.query<UserRow>(
                `
                SELECT
                    *
                FROM users
                WHERE lower(email) = lower($1)
                LIMIT 1
                `,
                [input.email]
            );

        const existingEmailUser =
            emailResult.rows[0];

        if (existingEmailUser) {
            await client.query(
                `
                INSERT INTO oauth_accounts (
                    provider,
                    provider_account_id,
                    user_id
                )
                VALUES ($1, $2, $3)
                `,
                [
                    input.provider,
                    input.providerAccountId,
                    existingEmailUser.id,
                ]
            );

            await client.query(
                `
                UPDATE users
                SET
                    email_verified_at =
                        COALESCE(
                            email_verified_at,
                            now()
                        ),
                    display_name =
                        COALESCE(
                            NULLIF($2, ''),
                            display_name
                        ),
                    avatar_url =
                        COALESCE(
                            NULLIF($3, ''),
                            avatar_url
                        ),
                    updated_at = now()
                WHERE id = $1
                `,
                [
                    existingEmailUser.id,
                    input.displayName ?? "",
                    input.avatarUrl ?? "",
                ]
            );

            await client.query("COMMIT");

            const user =
                await findUserById(
                    existingEmailUser.id
                );

            if (!user) {
                throw new Error(
                    "Usuário OAuth não encontrado após vinculação."
                );
            }

            return user;
        }

        const username =
            await createUniqueOAuthUsername(
                input.suggestedUsername
            );

        const userResult =
            await client.query<UserRow>(
                `
                INSERT INTO users (
                    email,
                    email_verified_at,
                    password_hash,
                    username,
                    display_name,
                    account_type,
                    active_mode,
                    avatar_url,
                    bio
                )
                VALUES (
                    $1,
                    now(),
                    NULL,
                    $2,
                    $3,
                    'user',
                    'user',
                    $4,
                    NULL
                )
                RETURNING *
                `,
                [
                    input.email,
                    username,
                    input.displayName ??
                    username,
                    input.avatarUrl ??
                    null,
                ]
            );

        const user =
            userResult.rows[0];

        await client.query(
            `
            INSERT INTO oauth_accounts (
                provider,
                provider_account_id,
                user_id
            )
            VALUES ($1, $2, $3)
            `,
            [
                input.provider,
                input.providerAccountId,
                user.id,
            ]
        );

        await client.query("COMMIT");

        return mapUserRow(user);
    } catch (error) {
        await client.query("ROLLBACK");
        throw error;
    } finally {
        client.release();
    }
}

export async function markEmailVerified(
    userId: string
): Promise<void> {
    await pool.query(
        `
        UPDATE users
        SET
            email_verified_at = COALESCE(
                email_verified_at,
                now()
            ),
            updated_at = now()
        WHERE id = $1
        `,
        [userId]
    );
}