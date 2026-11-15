import { NextResponse } from "next/server";
import { z } from "zod";
import { StatusPedido } from "@prisma/client";
import { alterarStatusPedido } from "@/server/pedidos";
import { naoAutorizado, sessaoApi } from "@/lib/api-auth";

const schema = z.object({ status: z.nativeEnum(StatusPedido), observacao: z.string().max(500).optional() });

export async function PATCH(req: Request, context: { params: { id: string } }) {
  const usuario = await sessaoApi();
  if (!usuario) return naoAutorizado();
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ erro: "Status inválido." }, { status: 400 });
  try {
    const pedido = await alterarStatusPedido(usuario.tenantId, context.params.id, parsed.data.status, parsed.data.observacao);
    return NextResponse.json(pedido);
  } catch (e) {
    const mensagem = e instanceof Error ? e.message : "";
    if (mensagem === "PEDIDO_NAO_ENCONTRADO") return NextResponse.json({ erro: "Pedido não encontrado." }, { status: 404 });
    if (mensagem === "TRANSICAO_INVALIDA") return NextResponse.json({ erro: "Essa mudança de status não é permitida." }, { status: 409 });
    return NextResponse.json({ erro: "Não foi possível atualizar o pedido." }, { status: 400 });
  }
}
