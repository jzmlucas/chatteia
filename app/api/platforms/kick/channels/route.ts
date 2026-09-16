import { getAllKickTokens } from "@/lib/platforms/kick/token-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const tokens = await getAllKickTokens();

  return Response.json({
    count: tokens.length,
    channels: tokens.map((token) => ({
      broadcasterUserId: token.broadcasterUserId,
      username: token.username,
      scope: token.scope,
      expiresAt: token.expiresAt,
    })),
  });
}
