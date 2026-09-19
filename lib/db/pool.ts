import { Pool } from "pg";

// Pool único e reaproveitado entre requests (padrão recomendado do
// node-postgres em ambientes serverless/Next.js — nunca crie um Pool
// novo por request).
const globalForPg = globalThis as unknown as {
    __chatteiaPgPool?: Pool;
};

function createPool(): Pool {
    const connectionString = process.env.DATABASE_URL;

    if (!connectionString) {
        throw new Error("DATABASE_URL não configurado.");
    }

    return new Pool({
        connectionString,
        // SSL costuma ser necessário em Postgres gerenciado (RDS, etc.),
        // mas não numa VPS própria com Postgres local — controlável via
        // env var para não travar seu teste local.
        ssl:
            process.env.DATABASE_SSL === "true"
                ? { rejectUnauthorized: false }
                : undefined,
        max: 10,
    });
}

export const pool = globalForPg.__chatteiaPgPool ?? createPool();

if (process.env.NODE_ENV !== "production") {
    globalForPg.__chatteiaPgPool = pool;
}

/**
 * Helper de query simples. Para transações reais, pegue um client via
 * `pool.connect()` diretamente (ver lib/auth/users.ts para exemplo).
 */
export async function query<T extends Record<string, unknown> = Record<string, unknown>>(
    text: string,
    params?: unknown[]
) {
    return pool.query<T>(text, params);
}
