import bcrypt from "bcryptjs";

// bcryptjs é puro JavaScript (sem binário nativo), então funciona em
// qualquer VPS sem precisar compilar nada — troque por "argon2" no
// futuro se quiser algo ainda mais moderno, mas isso exige toolchain
// de compilação C++ na VPS.
const SALT_ROUNDS = 12;

export async function hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, SALT_ROUNDS);
}

export async function verifyPassword(
    password: string,
    hash: string
): Promise<boolean> {
    return bcrypt.compare(password, hash);
}
