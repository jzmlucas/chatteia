import { NextResponse } from "next/server";

export async function GET() {
return new NextResponse(
`<!DOCTYPE html>

<html lang="pt-BR">
<head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>404 — Chatteia</title>

<style>
    * {
        box-sizing: border-box;
    }

    html,
    body {
        margin: 0;
        padding: 0;
        min-height: 100%;
    }

    body {
        min-height: 100vh;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 24px;
        background: #09090b;
        color: #fafafa;
        font-family:
            Inter,
            ui-sans-serif,
            system-ui,
            -apple-system,
            BlinkMacSystemFont,
            "Segoe UI",
            sans-serif;
    }

    .container {
        position: relative;
        width: 100%;
        max-width: 560px;
        text-align: center;
    }

    .glow {
        position: fixed;
        width: 500px;
        height: 500px;
        left: 50%;
        top: 50%;
        transform: translate(-50%, -50%);
        border-radius: 9999px;
        background: rgba(236, 72, 153, 0.10);
        filter: blur(120px);
        pointer-events: none;
    }

    .content {
        position: relative;
        z-index: 1;
    }

    .logo {
        display: inline-block;
        margin-bottom: 40px;
        color: #fafafa;
        text-decoration: none;
        font-size: 30px;
        font-weight: 600;
        letter-spacing: -0.03em;
    }

    .error {
        margin: 0;
        font-size: clamp(120px, 25vw, 220px);
        line-height: 0.8;
        font-weight: 900;
        letter-spacing: -0.09em;
        color: rgba(250, 250, 250, 0.055);
        user-select: none;
    }

    .text {
        margin-top: -12px;
    }

    h1 {
        margin: 0;
        font-size: 30px;
        line-height: 1.2;
        font-weight: 600;
        letter-spacing: -0.03em;
    }

    p {
        max-width: 440px;
        margin: 16px auto 0;
        color: #a1a1aa;
        font-size: 15px;
        line-height: 1.7;
    }

    .button {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        height: 44px;
        margin-top: 32px;
        padding: 0 24px;
        border-radius: 12px;
        background: #ec4899;
        color: white;
        text-decoration: none;
        font-size: 14px;
        font-weight: 500;
        box-shadow: 0 10px 30px rgba(236, 72, 153, 0.20);
        transition:
            background 0.2s ease,
            transform 0.2s ease,
            box-shadow 0.2s ease;
    }

    .button:hover {
        background: #f472b6;
        box-shadow: 0 10px 35px rgba(236, 72, 153, 0.30);
    }

    .button:active {
        transform: scale(0.98);
    }

    .footer {
        margin-top: 56px;
        color: rgba(161, 161, 170, 0.5);
        font-size: 12px;
    }

    @media (max-width: 640px) {
        h1 {
            font-size: 25px;
        }

        p {
            font-size: 14px;
        }
    }
</style>

</head>

<body>
    <div class="glow"></div>

<main class="container">
    <div class="content">
        <a class="logo" href="/">
            Chatteia
        </a>

        <div class="error">
            404
        </div>

        <div class="text">
            <h1>
                Página não encontrada
            </h1>

            <p>
                A página que você tentou acessar não existe
                ou o endereço informado está incorreto.
            </p>

            <a class="button" href="/">
                Voltar para o início
            </a>
        </div>

        <div class="footer">
            Chatteia
        </div>
    </div>
</main>

</body>
</html>`,
        {
            status: 404,
            headers: {
                "Content-Type": "text/html; charset=utf-8",
            },
        }
    );
}
