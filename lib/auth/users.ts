import { pool } from "@/lib/db/pool";
import type {
    AccountType,
    ActiveMode,
    UserRow,
} from "@/types/user";

export async function findUserByEmail(
    email: string
): Promise<UserRow | null> {
    const { rows } = await pool.query<UserRow>(
        `
        SELECT
            u.*,
            p.username,
            p.display_name,
            p.account_type,
            p.avatar_url,
            p.bio,
            p.active_mode
        FROM users u
        JOIN profiles p ON p.id = u.id
        WHERE lower(u.email) = lower($1)
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
            u.*,
            p.username,
            p.display_name,
            p.account_type,
            p.avatar_url,
            p.bio,
            p.active_mode
        FROM users u
        JOIN profiles p ON p.id = u.id
        WHERE lower(p.username) = lower($1)
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
            u.*,
            p.username,
            p.display_name,
            p.account_type,
            p.avatar_url,
            p.bio,
            p.active_mode
        FROM users u
        JOIN profiles p ON p.id = u.id
        WHERE u.id = $1
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
    const client = await pool.connect();

    try {
        await client.query("BEGIN");

        const userResult = await client.query<UserRow>(
            `
            INSERT INTO users (
                email,
                password_hash
            )
            VALUES ($1, $2)
            RETURNING *
            `,
            [
                input.email,
                input.passwordHash,
            ]
        );

        const user = userResult.rows[0];

        await client.query(
            `
            INSERT INTO profiles (
                id,
                username,
                display_name,
                account_type
            )
            VALUES ($1, $2, $3, $4)
            `,
            [
                user.id,
                input.username,
                input.displayName ?? input.username,
                input.accountType ?? "user",
            ]
        );

        await client.query("COMMIT");

        return {
            ...user,
            username: input.username,
            display_name:
                input.displayName ?? input.username,
            account_type:
                input.accountType ?? "user",
            avatar_url: null,
            bio: null,
            active_mode: "user",
        } as UserRow;
    } catch (error) {
        await client.query("ROLLBACK");
        throw error;
    } finally {
        client.release();
    }
}

export async function updatePasswordHash(
    userId: string,
    passwordHash: string
): Promise<void> {
    await pool.query(
        `
        UPDATE users
        SET password_hash = $2,
            updated_at = now()
        WHERE id = $1
        `,
        [userId, passwordHash]
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
    const { rows } = await pool.query(
        `
        UPDATE profiles
        SET
            display_name = $2,
            bio = $3,
            avatar_url = $4,
            updated_at = now()
        WHERE id = $1
        RETURNING id
        `,
        [
            userId,
            fields.display_name ?? null,
            fields.bio ?? null,
            fields.avatar_url ?? null,
        ]
    );

    if (!rows[0]) {
        return null;
    }

    return findUserById(userId);
}

export async function setActiveMode(
    userId: string,
    mode: ActiveMode
): Promise<UserRow | null> {
    const { rows } = await pool.query<UserRow>(
        `
        UPDATE profiles
        SET
            active_mode = $2,
            updated_at = now()
        WHERE id = $1
        RETURNING *
        `,
        [userId, mode]
    );

    if (!rows[0]) {
        return null;
    }

    return findUserById(userId);
}

export async function enableStreamerMode(
    userId: string
): Promise<UserRow | null> {
    const { rows } = await pool.query<UserRow>(
        `
        UPDATE profiles
        SET
            account_type = 'streamer',
            active_mode = 'streamer',
            updated_at = now()
        WHERE id = $1
        RETURNING *
        `,
        [userId]
    );

    if (!rows[0]) {
        return null;
    }

    return findUserById(userId);
}