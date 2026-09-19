export type AccountType =
    | "user"
    | "streamer";

export type ActiveMode =
    | "user"
    | "streamer";

export type UserRow = {
    id: string;

    email: string;
    email_verified_at: string | null;
    password_hash: string | null;

    created_at: string;
    updated_at: string;

    username: string;
    display_name: string | null;

    account_type: AccountType;
    active_mode: ActiveMode;

    avatar_url: string | null;
    bio: string | null;
};

export type Profile =
    Omit<UserRow, "password_hash">;

export function toProfile(
    row: UserRow
): Profile {
    const {
        password_hash,
        ...profile
    } = row;

    return profile;
}