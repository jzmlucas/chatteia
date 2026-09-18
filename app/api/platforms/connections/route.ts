import { NextRequest, NextResponse } from "next/server";
import { platformConnectionRepo } from "@/lib/repositories/platformConnections";
import { getSessionUser } from "@/lib/auth/getSessionUser";
import type { ChatPlatform } from "@/lib/chat/types";

type ConnectionStatus =
  | { connected: false }
  | {
    connected: true;
    username: string;
    platformUserId: string;
    connectedAt: string;
  };

type ConnectionsResponse = Record<ChatPlatform, ConnectionStatus>;

export async function GET(request: NextRequest) {
  try {
    const sessionUser = await getSessionUser(request);

    if (!sessionUser) {
      return NextResponse.json(
        { error: "Usuário não autenticado" },
        { status: 401 }
      );
    }

    const connections = await platformConnectionRepo.findByUserId(
      sessionUser.id
    );

    const response: ConnectionsResponse = {
      kick: { connected: false },
      twitch: { connected: false },
      youtube: { connected: false },
      tiktok: { connected: false },
    };

    for (const connection of connections) {
      response[connection.platform] = {
        connected: true,
        username: connection.platformUsername,
        platformUserId: connection.platformUserId,
        connectedAt: connection.connectedAt.toISOString(),
      };
    }

    return NextResponse.json(response);
  } catch (error) {
    console.error("Erro ao buscar conexões de plataforma:", error);

    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}