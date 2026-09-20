"use client";

import { useEffect, useRef } from "react";

import { cn } from "@/lib/utils";

interface FontWeightTextProps {
    text: string;
    className?: string;
    fontSize?: number;
    minWeight?: number;
    maxWeight?: number;
    animationDuration?: number;
    delayMultiplier?: number;
}

export function FontWeightText({
    text,
    className = "",
    fontSize = 150,
    minWeight = 300,
    maxWeight = 800,
    animationDuration = 1.5,
    delayMultiplier = 0.15,
}: FontWeightTextProps) {
    const containerRef = useRef<HTMLParagraphElement>(null);

    useEffect(() => {
        if (!containerRef.current) {
            return;
        }

        const spans =
            containerRef.current.querySelectorAll<HTMLSpanElement>(
                "span[data-letter]"
            );

        const numLetters = spans.length;

        spans.forEach((span, index) => {
            const mappedIndex =
                index - numLetters / 2;

            span.style.animationDelay =
                `${mappedIndex * delayMultiplier}s`;
        });
    }, [text, delayMultiplier]);

    const characters = text.split("").map((char, index) => (
        <span
            key={`${char}-${index}`}
            data-letter="true"
            aria-hidden="true"
            className="inline-block"
            style={{
                animation: `chatteia-font-breath ${animationDuration}s alternate cubic-bezier(0.37, 0, 0.63, 1) infinite`,
                animationFillMode: "both",
                fontVariationSettings: `"wght" ${minWeight}`,
            }}
        >
            {char === " " ? "\u00A0" : char}
        </span>
    ));

    return (
        <div className="flex items-center justify-center">
            <p
                ref={containerRef}
                className={cn(
                    "m-0 whitespace-nowrap",
                    className
                )}
                aria-label={text}
                style={{
                    fontFamily:
                        "var(--font-inter), sans-serif",

                    fontSize: `${fontSize}px`,

                    fontWeight: minWeight,

                    lineHeight: 1,

                    fontVariationSettings:
                        `"wght" ${minWeight}`,
                }}
            >
                {characters}

                <style jsx>{`
                    @keyframes chatteia-font-breath {
                        0% {
                            font-weight: ${minWeight};
                            font-variation-settings:
                                "wght" ${minWeight};
                        }

                        100% {
                            font-weight: ${maxWeight};
                            font-variation-settings:
                                "wght" ${maxWeight};
                        }
                    }

                    @media (prefers-reduced-motion: reduce) {
                        span[data-letter] {
                            animation: none !important;
                            font-weight: ${maxWeight} !important;
                            font-variation-settings:
                                "wght" ${maxWeight} !important;
                        }
                    }
                `}</style>
            </p>
        </div>
    );
}
