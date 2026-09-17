import { redirect } from "@/i18n/navigation";

export default async function LegacyTwitchChatRedirect({
                                                           params,
                                                       }: {
    params: Promise<{ channel: string; locale: string }>;
}) {
    const { channel, locale } = await params;

    redirect({
        href: `/chat/twitch/${channel}`,
        locale,
    });
}