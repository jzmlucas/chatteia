export type AccountType = "user" | "streamer";

export type Profile = {
    id: string;
    username: string;
    display_name: string | null;
    account_type: AccountType;
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
    avatar_url?: string | null;
    bio?: string | null;
};

export type ProfileUpdate = Partial<
    Omit<ProfileInsert, "id">
>;

/**
 * Tipagem mínima do banco (apenas a tabela `profiles`, usada pelo
 * sistema de cadastro/login). Se quiser tipagem completa, gere com:
 * `npx supabase gen types typescript --project-id ibkuzpvthrmclkhruwyf`
 */
export type Database = {
    public: {
        Tables: {
            profiles: {
                Row: Profile;
                Insert: ProfileInsert;
                Update: ProfileUpdate;
            };
        };
    };
};
