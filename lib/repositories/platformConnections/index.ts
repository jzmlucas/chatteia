/*
 * ============================================================================
 * REPOSITÓRIO ATIVO
 * ============================================================================
 *
 * Exporta a instância singleton do repositório de conexões de plataformas.
 * Antes era o Supabase; agora é Postgres puro via `pg`.
 */

import { PostgresPlatformConnectionRepository } from "./postgres";

export const platformConnectionRepo = new PostgresPlatformConnectionRepository();

// Re-exporta os tipos para facilitar o import em outros arquivos
export type { PlatformConnection, PlatformConnectionRepository } from "./types";
