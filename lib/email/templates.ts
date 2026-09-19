export function verificationEmail(link: string) {
    return {
        subject: "Confirme seu e-mail — Chatteia",
        text: `Confirme seu cadastro no Chatteia acessando: ${link}\n\nSe você não criou essa conta, ignore este e-mail.`,
        html: `
            <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
                <h2>Confirme seu e-mail</h2>
                <p>Clique no botão abaixo para confirmar seu cadastro no Chatteia:</p>
                <p>
                    <a href="${link}" style="display:inline-block;background:#F55376;color:#fff;padding:12px 20px;text-decoration:none;border-radius:4px;">
                        Confirmar e-mail
                    </a>
                </p>
                <p style="color:#888;font-size:12px;">Se você não criou essa conta, ignore este e-mail.</p>
            </div>
        `,
    };
}

export function passwordResetEmail(link: string) {
    return {
        subject: "Redefinir senha — Chatteia",
        text: `Redefina sua senha do Chatteia acessando: ${link}\n\nSe você não pediu isso, ignore este e-mail — sua senha continua a mesma.`,
        html: `
            <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
                <h2>Redefinir senha</h2>
                <p>Clique no botão abaixo para escolher uma nova senha:</p>
                <p>
                    <a href="${link}" style="display:inline-block;background:#F55376;color:#fff;padding:12px 20px;text-decoration:none;border-radius:4px;">
                        Redefinir senha
                    </a>
                </p>
                <p style="color:#888;font-size:12px;">Se você não pediu isso, ignore este e-mail — sua senha continua a mesma.</p>
            </div>
        `,
    };
}
