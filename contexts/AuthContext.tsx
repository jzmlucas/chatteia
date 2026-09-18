"use client";

import {
    createContext,
    useContext,
    useEffect,
    useState,
} from "react";

import type { Session, User } from "@supabase/supabase-js";

import { supabaseBrowser } from "@/lib/supabase/client";
import type { Profile } from "@/types/supabase";

type AuthContextValue = {
    user: User | null;
    session: Session | null;
    profile: Profile | null;
    loading: boolean;
    isStreamer: boolean;
    refreshProfile: () => Promise<void>;
    signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(
    undefined
);

async function fetchProfile(
    userId: string
): Promise<Profile | null> {
    const { data, error } = await supabaseBrowser
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .maybeSingle();

    if (error) {
        console.error(
            "Erro ao buscar profile:",
            error.message
        );

        return null;
    }

    return data;
}

async function syncSessionCookie(accessToken: string | undefined) {
    try {
        if (accessToken) {
            await fetch("/api/session/sync", {
                method: "POST",
                credentials: "include",
                headers: { Authorization: `Bearer ${accessToken}` },
            });
        } else {
            await fetch("/api/session/sync", {
                method: "DELETE",
                credentials: "include",
            });
        }
    } catch {
        // Silencia — o cookie fica só como fallback; requests que já
        // mandam o Authorization header continuam funcionando.
    }
}

export function AuthProvider({
                                  children,
                              }: {
    children: React.ReactNode;
}) {
    const [session, setSession] =
        useState<Session | null>(null);

    const [profile, setProfile] =
        useState<Profile | null>(null);

    const [loading, setLoading] =
        useState(true);

    useEffect(() => {
        let active = true;

        async function init() {
            const {
                data: { session: currentSession },
            } = await supabaseBrowser.auth.getSession();

            if (!active) {
                return;
            }

            setSession(currentSession);
            await syncSessionCookie(currentSession?.access_token);

            if (currentSession?.user) {
                const currentProfile = await fetchProfile(
                    currentSession.user.id
                );

                if (active) {
                    setProfile(currentProfile);
                }
            }

            if (active) {
                setLoading(false);
            }
        }

        init();

        const {
            data: { subscription },
        } = supabaseBrowser.auth.onAuthStateChange(
            async (_event, nextSession) => {
                setSession(nextSession);
                await syncSessionCookie(nextSession?.access_token);

                if (nextSession?.user) {
                    const nextProfile = await fetchProfile(
                        nextSession.user.id
                    );

                    setProfile(nextProfile);
                } else {
                    setProfile(null);
                }

                setLoading(false);
            }
        );

        return () => {
            active = false;
            subscription.unsubscribe();
        };
    }, []);

    async function refreshProfile() {
        if (!session?.user) {
            return;
        }

        const nextProfile = await fetchProfile(
            session.user.id
        );

        setProfile(nextProfile);
    }

    async function signOut() {
        await supabaseBrowser.auth.signOut();
        await syncSessionCookie(undefined);

        setSession(null);
        setProfile(null);
    }

    return (
        <AuthContext.Provider
            value={{
                user: session?.user ?? null,
                session,
                profile,
                loading,
                isStreamer: profile?.account_type === "streamer",
                refreshProfile,
                signOut,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);

    if (!context) {
        throw new Error(
            "useAuth precisa ser usado dentro de <AuthProvider>."
        );
    }

    return context;
}
