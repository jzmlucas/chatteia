"use client";

export function ChatNewMessagesButton({
                                          count,
                                          onClick,
                                      }: {
    count: number;
    onClick: () => void;
}) {
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
                border-purple-400/30
                bg-twitch-purple
                px-4
                py-2
                text-sm
                font-medium
                text-white
                shadow-lg
                transition
                hover:bg-purple-600
                focus:outline-none
                focus:ring-2
                focus:ring-purple-400
            "
        >
            +{" "}
            {count === 1
                ? "1 mensagem"
                : `${count} mensagens`}
        </button>
    );
}