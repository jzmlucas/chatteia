/*
 * ============================================================================
 * REPOSITÓRIO ATIVO
 * ============================================================================
 *
 * Exporta a instância singleton do repositório de conexões de plataformas.
 *
 * Para migrar de banco de dados no futuro, basta:
 *   1. Criar um novo arquivo (ex: `prisma.ts`) implementando `PlatformConnectionRepository`
 *   2. Importar e instanciar abaixo
 *   3. Pronto — todo o resto do código permanece igual.
 *
 * Exemplo:
 *   import { PrismaPlatformConnectionRepository } from "./prisma";
 *   export const platformConnectionRepo = new PrismaPlatformConnectionRepository();
 */

import { SupabasePlatformConnectionRepository } from "./supabase";

export const platformConnectionRepo = new SupabasePlatformConnectionRepository();

// Re-exporta os tipos para facilitar o import em outros arquivos
export type { PlatformConnection, PlatformConnectionRepository } from "./types";
