import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Chatteia",
  description: "Acompanhe o chat de qualquer canal da Twitch.",
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
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <body className="bg-twitch-dark text-zinc-100 min-h-screen">
        {children}
      </body>
    </html>
  );
}
