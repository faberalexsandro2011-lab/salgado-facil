import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth-options";

export async function sessaoApi() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || !session.user.tenantId) return null;
  return session.user;
}

export function naoAutorizado() {
  return NextResponse.json({ erro: "É necessário entrar na sua conta." }, { status: 401 });
}

export function proibido() {
  return NextResponse.json({ erro: "Você não tem permissão para esta operação." }, { status: 403 });
}
