import {
    FormEvent,
    useEffect,
    useState,
} from "react";

import { useTranslations } from "next-intl";

import { useAuth } from "@/contexts/AuthContext";

export function useAccountForm() {
    const t = useTranslations("auth");

    const {
        user,
        profile,
        refreshProfile,
    } = useAuth();

    const [displayName, setDisplayName] =
        useState("");

    const [bio, setBio] =
        useState("");

    const [avatarUrl, setAvatarUrl] =
        useState("");

    const [error, setError] =
        useState<string | null>(null);

    const [success, setSuccess] =
        useState(false);

    const [saving, setSaving] =
        useState(false);

    useEffect(() => {
        if (!profile) {
            return;
        }

        setDisplayName(
            profile.display_name ?? ""
        );

        setBio(
            profile.bio ?? ""
        );

        setAvatarUrl(
            profile.avatar_url ?? ""
        );
    }, [profile]);

    async function handleSubmit(
        event: FormEvent<HTMLFormElement>
    ) {
        event.preventDefault();

        if (!user) {
            return;
        }

        setError(null);
        setSuccess(false);
        setSaving(true);

        try {
            const payload = {
                display_name:
                    displayName.trim() || null,

                bio:
                    bio.trim() || null,

                avatar_url:
                    avatarUrl.trim() || null,
            };

            console.log(
                "[ACCOUNT] Enviando:",
                payload
            );

            const response = await fetch(
                "/api/auth/profile",
                {
                    method: "PATCH",
                    credentials: "include",
                    headers: {
                        "Content-Type":
                            "application/json",
                    },
                    body: JSON.stringify(
                        payload
                    ),
                }
            );

            const data =
                await response
                    .json()
                    .catch(() => null);

            console.log(
                "[ACCOUNT] Resposta:",
                response.status,
                data
            );

            if (!response.ok) {
                setError(
                    data?.error ??
                    t("errorGeneric")
                );

                return;
            }

            await refreshProfile();

            setSuccess(true);
        } catch (error) {
            console.error(
                "[ACCOUNT] Erro:",
                error
            );

            setError(
                t("errorGeneric")
            );
        } finally {
            setSaving(false);
        }
    }

    return {
        displayName,
        setDisplayName,

        bio,
        setBio,

        avatarUrl,
        setAvatarUrl,

        error,
        success,
        saving,

        handleSubmit,

        t,
    };
}