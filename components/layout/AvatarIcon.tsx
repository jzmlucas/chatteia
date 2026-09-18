"use client";

type AvatarIconProps = {
    avatarUrl?: string | null;
    label?: string | null;
    size?: number;
    className?: string;
};

function getInitial(label?: string | null) {
    const trimmed = label?.trim();

    if (!trimmed) {
        return null;
    }

    return trimmed.charAt(0).toUpperCase();
}

export function AvatarIcon({
                                avatarUrl,
                                label,
                                size = 36,
                                className = "",
                            }: AvatarIconProps) {
    const dimension = `${size}px`;

    if (avatarUrl) {
        return (
            <img
                src={avatarUrl}
                alt=""
                width={size}
                height={size}
                style={{
                    width: dimension,
                    height: dimension,
                }}
                className={`rounded-full border border-twitch-border object-cover ${className}`}
            />
        );
    }

    const initial = getInitial(label);

    if (initial) {
        return (
            <div
                style={{
                    width: dimension,
                    height: dimension,
                }}
                className={`flex items-center justify-center rounded-full border border-twitch-border bg-[#F55376] text-sm font-semibold text-white ${className}`}
            >
                {initial}
            </div>
        );
    }

    return (
        <div
            style={{
                width: dimension,
                height: dimension,
            }}
            className={`flex items-center justify-center rounded-full border border-twitch-border bg-twitch-panel text-zinc-400 ${className}`}
        >
            <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                width="60%"
                height="60%"
                aria-hidden="true"
            >
                <circle cx="12" cy="8" r="3.5" />
                <path d="M4.5 20c1.6-3.6 4.4-5.4 7.5-5.4s5.9 1.8 7.5 5.4" />
            </svg>
        </div>
    );
}
