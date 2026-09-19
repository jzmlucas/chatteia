import type { OAuthProvider } from "./types";
import { googleProvider } from "./google";
import { twitchProvider } from "./twitch";

/*
 * Para adicionar um novo provedor de login (ex: GitHub, Discord):
 *   1. Crie lib/auth/oauth/<provider>.ts implementando OAuthProvider
 *   2. Registre aqui
 *   3. Pronto — /api/auth/oauth/<provider>/authorize e /callback já funcionam
 */
export const oauthProviders: Record<string, OAuthProvider> = {
    google: googleProvider,
    twitch: twitchProvider,
};

export function getOAuthProvider(id: string): OAuthProvider | null {
    return oauthProviders[id] ?? null;
}
