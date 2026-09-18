"use client";

import { Link } from "@/i18n/navigation";

export function HomeLogoLink() {
    return (
        <Link
            href="/"
            className="mb-6 flex flex-col items-center gap-2 text-center"
        >
            <img
                width="56"
                height="56"
                src="https://img.icons8.com/color-glass/96/parrot.png"
                alt=""
                aria-hidden="true"
                draggable="false"
            />

            <span className="text-lg font-bold tracking-tight text-zinc-100">
                Chatteia
            </span>
        </Link>
    );
}
