export type AccountType = "user" | "streamer";

export type ActiveMode = "user" | "streamer";

export type Profile = {
    id: string;
    username: string;
    display_name: string | null;
    account_type: AccountType;
    active_mode: ActiveMode;
    avatar_url: string | null;
    bio: string | null;
    created_at: string;
    updated_at: string;
};

export type ProfileInsert = {
    id: string;
    username: string;
    display_name?: string | null;
    account_type?: AccountType;
    active_mode?: ActiveMode;
    avatar_url?: string | null;
    bio?: string | null;
};

export type ProfileUpdate = {
    username?: string;
    display_name?: string | null;
    account_type?: AccountType;
    active_mode?: ActiveMode;
    avatar_url?: string | null;
    bio?: string | null;
};

export type Database = {
    public: {
        Tables: {
            profiles: {
                Row: Profile;
                Insert: ProfileInsert;
                Update: ProfileUpdate;
                Relationships: [];
            };
        };

        Views: {
            [_ in never]: never;
        };

        Functions: {
            [_ in never]: never;
        };

        Enums: {
            account_type: AccountType;
            active_mode: ActiveMode;
        };

        CompositeTypes: {
            [_ in never]: never;
        };
    };
};