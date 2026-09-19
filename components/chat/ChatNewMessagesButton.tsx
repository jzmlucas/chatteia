"use client";

import { useTranslations } from "next-intl";

export function ChatNewMessagesButton({
                                          count,
                                          onClick,
                                      }: {
    count: number;
    onClick: () => void;
}) {
    const t = useTranslations("chat");

    if (count <= 0) {
        return null;
    }

    return (
        <button
            type="button"
            onClick={onClick}
            className="
                absolute
                bottom-4
                left-1/2
                z-10
                -translate-x-1/2
                rounded-full
                border
                border-[#f76f9c]/30
                bg-[#F55376]
                px-4
                py-2
                text-sm
                font-medium
                text-white
                shadow-lg
                transition
                hover:bg-[#e33361]
                focus:outline-none
                focus:ring-2
                focus:ring-[#f76f9c]
            "
        >
            {t("newMessagesButton", { count })}
        </button>
    );
}