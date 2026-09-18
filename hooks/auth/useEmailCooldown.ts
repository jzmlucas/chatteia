import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Cooldown persistido em localStorage por `key`. Usado para não deixar
 * o usuário disparar vários signUp/resend seguidos e estourar o rate
 * limit de e-mail do Supabase (o erro "email rate limit exceeded").
 *
 * Retorna quantos segundos faltam para poder tentar de novo, e uma
 * função `start(seconds)` para iniciar o cooldown após um envio.
 */
export function useEmailCooldown(key: string) {
    const [secondsLeft, setSecondsLeft] = useState(0);

    const intervalRef =
        useRef<ReturnType<typeof setInterval> | null>(null);

    const storageKey = `chatteia:email-cooldown:${key}`;

    const tick = useCallback(() => {
        const raw = window.localStorage.getItem(storageKey);

        if (!raw) {
            setSecondsLeft(0);

            return;
        }

        const remaining = Math.ceil(
            (Number(raw) - Date.now()) / 1000
        );

        setSecondsLeft(remaining > 0 ? remaining : 0);
    }, [storageKey]);

    useEffect(() => {
        tick();

        intervalRef.current = setInterval(tick, 1000);

        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
            }
        };
    }, [tick]);

    function start(seconds: number) {
        const until = Date.now() + seconds * 1000;

        window.localStorage.setItem(
            storageKey,
            String(until)
        );

        tick();
    }

    return {
        secondsLeft,
        isCoolingDown: secondsLeft > 0,
        start,
    };
}
