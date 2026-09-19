export type OAuthProfile = {
    providerAccountId: string;
    email: string;
    suggestedUsername: string;
    displayName?: string | null;
    avatarUrl?: string | null;
};

export interface OAuthProvider {
    id: string;

    getAuthorizationUrl(params: {
        state: string;
        redirectUri: string;
    }): string;

    exchangeCodeForProfile(params: {
        code: string;
        redirectUri: string;
    }): Promise<OAuthProfile>;
}
