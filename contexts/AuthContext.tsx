"use client";

import {
    createContext,
    useContext,
    useEffect,
    useState,
} from "react";

import type {
    Session,
    User,
} from "@supabase/supabase-js";

import { supabaseBrowser } from "@/lib/supabase/client";

import type {
    ActiveMode,
    Profile,
} from "@/types/supabase";

type AuthContextValue = {
    user: User | null;
    session: Session | null;
    profile: Profile | null;
    loading: boolean;
    isStreamer: boolean;
    isStreamerMode: boolean;
    activeMode: ActiveMode;
    refreshProfile: () => Promise<void>;
    setActiveMode: (
        mode: ActiveMode
    ) => Promise<boolean>;
    enableStreamerMode: () => Promise<boolean>;
    signOut: () => Promise<void>;
};

const AuthContext =
    createContext<AuthContextValue | undefined>(
        undefined
    );

async function fetchProfile(
    userId: string
): Promise<Profile | null> {
    const {
        data,
        error,
    } = await supabaseBrowser
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

async function syncSessionCookie(
    accessToken: string | undefined
) {
    try {
        if (accessToken) {
            await fetch(
                "/api/session/sync",
                {
                    method: "POST",
                    credentials: "include",
                    headers: {
                        Authorization: `Bearer ${accessToken}`,
                    },
                }
            );
        } else {
            await fetch(
                "/api/session/sync",
                {
                    method: "DELETE",
                    credentials: "include",
                }
            );
        }
    } catch {
    }
}

export function AuthProvider({
                                 children,
                             }: {
    children: React.ReactNode;
}) {
    const [
        session,
        setSession,
    ] = useState<Session | null>(
        null
    );

    const [
        profile,
        setProfile,
    ] = useState<Profile | null>(
        null
    );

    const [
        loading,
        setLoading,
    ] = useState(true);

    useEffect(() => {
        let active = true;

        async function init() {
            const {
                data: {
                    session:
                        currentSession,
                },
            } =
                await supabaseBrowser.auth.getSession();

            if (!active) {
                return;
            }

            setSession(
                currentSession
            );

            await syncSessionCookie(
                currentSession?.access_token
            );

            if (
                currentSession?.user
            ) {
                const currentProfile =
                    await fetchProfile(
                        currentSession.user.id
                    );

                if (active) {
                    setProfile(
                        currentProfile
                    );
                }
            } else {
                setProfile(null);
            }

            if (active) {
                setLoading(false);
            }
        }

        init();

        const {
            data: {
                subscription,
            },
        } =
            supabaseBrowser.auth.onAuthStateChange(
                async (
                    _event,
                    nextSession
                ) => {
                    setSession(
                        nextSession
                    );

                    await syncSessionCookie(
                        nextSession?.access_token
                    );

                    if (
                        nextSession?.user
                    ) {
                        const nextProfile =
                            await fetchProfile(
                                nextSession.user.id
                            );

                        setProfile(
                            nextProfile
                        );
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

        const nextProfile =
            await fetchProfile(
                session.user.id
            );

        setProfile(
            nextProfile
        );
    }

    async function setActiveMode(
        mode: ActiveMode
    ): Promise<boolean> {
        if (!session?.user) {
            return false;
        }

        if (
            mode === "streamer" &&
            profile?.account_type !==
            "streamer"
        ) {
            return false;
        }

        const {
            data,
            error,
        } =
            await supabaseBrowser
                .from("profiles")
                .update({
                    active_mode: mode,
                })
                .eq(
                    "id",
                    session.user.id
                )
                .select("*")
                .single();

        if (error) {
            console.error(
                "Erro ao alterar modo:",
                error.message
            );

            return false;
        }

        setProfile(data);

        return true;
    }

    async function enableStreamerMode(): Promise<boolean> {
        if (!session?.user) {
            return false;
        }

        const {
            data,
            error,
        } =
            await supabaseBrowser
                .from("profiles")
                .update({
                    account_type:
                        "streamer",
                    active_mode:
                        "streamer",
                })
                .eq(
                    "id",
                    session.user.id
                )
                .select("*")
                .single();

        if (error) {
            console.error(
                "Erro ao ativar modo streamer:",
                error.message
            );

            return false;
        }

        setProfile(data);

        return true;
    }

    async function signOut() {
        await supabaseBrowser.auth.signOut();

        await syncSessionCookie(
            undefined
        );

        setSession(null);
        setProfile(null);
    }

    const isStreamer =
        profile?.account_type ===
        "streamer";

    const isStreamerMode =
        isStreamer &&
        profile?.active_mode ===
        "streamer";

    const activeMode =
        profile?.active_mode ??
        "user";

    return (
        <AuthContext.Provider
            value={{
                user:
                    session?.user ??
                    null,

                session,

                profile,

                loading,

                isStreamer,

                isStreamerMode,

                activeMode,

                refreshProfile,

                setActiveMode,

                enableStreamerMode,

                signOut,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context =
        useContext(
            AuthContext
        );

    if (!context) {
        throw new Error(
            "useAuth precisa ser usado dentro de <AuthProvider>."
        );
    }

    return context;
}