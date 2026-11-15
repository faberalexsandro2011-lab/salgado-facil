import { NextResponse } from "next/server";
import { z } from "zod";
import { StatusPedido } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { criarPedido } from "@/server/pedidos";
import { naoAutorizado, sessaoApi } from "@/lib/api-auth";

const schema = z.object({
  clienteId: z.string().optional().nullable(),
  clienteNome: z.string().max(120).optional().nullable(),
  telefone: z.string().max(30).optional().nullable(),
  observacao: z.string().max(1000).optional().nullable(),
  dataEntrega: z.string().datetime().optional().nullable(),
  desconto: z.number().finite().min(0).default(0),
  formaPagamento: z.enum(["DINHEIRO","PIX","DEBITO","CREDITO","TRANSFERENCIA"]).optional().nullable(),
  itens: z.array(z.object({ produtoId: z.string().min(1), quantidade: z.number().finite().positive() })).min(1),
});

export async function GET(req: Request) {
  const usuario = await sessaoApi();
  if (!usuario) return naoAutorizado();
  const status = new URL(req.url).searchParams.get("status");
  const filtro = Object.values(StatusPedido).includes(status as StatusPedido) ? status as StatusPedido : undefined;
  const pedidos = await prisma.pedido.findMany({
    where: { tenantId: usuario.tenantId, ...(filtro ? { status: filtro } : {}) },
    include: { itens: true, cliente: true, historico: { orderBy: { criadoEm: "asc" } } },
    orderBy: [{ dataEntrega: "asc" }, { criadoEm: "desc" }],
  });
  return NextResponse.json(pedidos);
}

export async function POST(req: Request) {
  const usuario = await sessaoApi();
  if (!usuario) return naoAutorizado();
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ erro: "Confira os dados e os itens do pedido.", detalhes: parsed.error.flatten() }, { status: 400 });
  try {
    const pedido = await criarPedido(usuario.tenantId, parsed.data);
    return NextResponse.json(pedido, { status: 201 });
  } catch (e) {
    const mensagem = e instanceof Error ? e.message : "";
    const erros: Record<string,string> = {
      PRODUTO_NAO_ENCONTRADO: "Um dos produtos não está disponível.",
      CLIENTE_NAO_ENCONTRADO: "Cliente não encontrado.",
      PEDIDO_SEM_ITENS: "Adicione ao menos um item.",
      QUANTIDADE_INVALIDA: "Quantidade inválida.",
      DESCONTO_INVALIDO: "Desconto inválido.",
      DESCONTO_MAIOR_SUBTOTAL: "Desconto não pode ser maior que o subtotal.",
    };
    return NextResponse.json({ erro: erros[mensagem] || "Não foi possível criar o pedido." }, { status: 400 });
  }
}
