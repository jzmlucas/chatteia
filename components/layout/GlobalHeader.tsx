"use client";

import { usePathname } from "next/navigation";

import { ProfileMenu } from "@/components/layout/ProfileMenu";

export function GlobalHeader() {
    const pathname = usePathname();

    // As páginas de overlay do OBS (browser source) precisam ficar
    // limpas — sem nenhum elemento de interface por cima do chat.
    const isObsOverlay = pathname?.includes("/obs/");

    // As páginas de chat (single e multichat) já têm o próprio header,
    // com o ProfileMenu embutido ao lado dos outros elementos. Se o
    // GlobalHeader também renderizasse aqui, o ícone do perfil ficaria
    // duplicado e flutuando por cima do header da página.
    const hasOwnHeader =
        pathname?.includes("/chat/twitch/") ||
        pathname?.includes("/chat/kick/") ||
        pathname?.includes("/chat/youtube/") ||
        pathname?.includes("/chat/tiktok/") ||
        pathname?.includes("/chat/multi-chat");

    if (isObsOverlay || hasOwnHeader) {
        return null;
    }

    return (
        <header className="fixed right-3 top-3 z-[100] sm:right-5 sm:top-5">
            <ProfileMenu />
        </header>
    );
}
