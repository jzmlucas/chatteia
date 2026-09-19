import nodemailer, { type Transporter } from "nodemailer";

let transporter: Transporter | null | undefined;

function getTransporter(): Transporter | null {
    if (transporter !== undefined) {
        return transporter;
    }

    const host = process.env.SMTP_HOST;
    const port = process.env.SMTP_PORT;
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASSWORD;

    if (!host || !port || !user || !pass) {
        // Sem SMTP configurado — cai no modo "console" abaixo. Ótimo
        // para o teste local, mas configure isso antes de ir pra
        // produção de verdade.
        transporter = null;

        return transporter;
    }

    transporter = nodemailer.createTransport({
        host,
        port: Number(port),
        secure: Number(port) === 465,
        auth: { user, pass },
    });

    return transporter;
}

export async function sendEmail(params: {
    to: string;
    subject: string;
    html: string;
    text: string;
}) {
    const client = getTransporter();

    if (!client) {
        console.log(
            "\n📧 [EMAIL — SMTP não configurado, exibindo no console]\n" +
                `Para: ${params.to}\n` +
                `Assunto: ${params.subject}\n` +
                `${params.text}\n`
        );

        return;
    }

    const from = process.env.SMTP_FROM || "Chatteia <no-reply@chatteia.local>";

    await client.sendMail({
        from,
        to: params.to,
        subject: params.subject,
        html: params.html,
        text: params.text,
    });
}
