import { NextRequest, NextResponse } from "next/server";
import { platformConnectionRepo } from "@/lib/repositories/platformConnections";
import { getSessionUser } from "@/lib/auth/getSessionUser";

export async function POST(request: NextRequest) {
  try {
    const sessionUser = await getSessionUser(request);

    if (!sessionUser) {
      return NextResponse.json(
        { error: "Usuário não autenticado" },
        { status: 401 }
      );
    }

    // Remove a conexão KICK do usuário
    await platformConnectionRepo.deleteByUserIdAndPlatform(
      sessionUser.id,
      "kick"
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Erro ao desconectar conta KICK:", error);

    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
