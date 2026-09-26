import type { Metadata } from "next";

import "./globals.css";

export const metadata: Metadata = {
    title: {
        default: "Chatteia",
        template: "%s | Chatteia",
    },
    description: "Acompanhe chats ao vivo em um só lugar.",
    icons: {
        icon: [
            { url: "/chatteia16.png", sizes: "16x16", type: "image/png" },
            { url: "/chatteia32.png", sizes: "32x32", type: "image/png" },
        ],
        apple: "/chatteia.png",
    },
};

export default function RootLayout({
    children,
}: Readonly<{ children: React.ReactNode }>) {
    return (
        <html lang="pt-BR">
            <body className="min-h-screen bg-twitch-dark text-zinc-100">
                {children}
            </body>
        </html>
    );
}
