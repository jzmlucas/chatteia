"use client";

import { useEffect } from "react";

export function useObsTransparentBackground() {
    useEffect(() => {
        const html = document.documentElement;
        const body = document.body;

        const previousHtmlBg = html.style.background;
        const previousBodyBg = body.style.background;

        html.style.background = "transparent";
        body.style.background = "transparent";

        return () => {
            html.style.background = previousHtmlBg;
            body.style.background = previousBodyBg;
        };
    }, []);
}