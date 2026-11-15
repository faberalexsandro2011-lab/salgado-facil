import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { naoAutorizado, sessaoApi } from "@/lib/api-auth";

export async function GET(_req: Request, context: { params: { id: string } }) {
  const usuario = await sessaoApi();
  if (!usuario) return naoAutorizado();
  const pedido = await prisma.pedido.findFirst({
    where: { id: context.params.id, tenantId: usuario.tenantId },
    include: { itens: true, cliente: true, historico: { orderBy: { criadoEm: "asc" } } },
  });
  if (!pedido) return NextResponse.json({ erro: "Pedido não encontrado." }, { status: 404 });
  return NextResponse.json(pedido);
}
