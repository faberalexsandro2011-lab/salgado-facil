import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { naoAutorizado, proibido, sessaoApi } from "@/lib/api-auth";

const produtoSchema = z.object({
  nome: z.string().trim().min(2).max(100),
  descricao: z.string().trim().max(500).optional().nullable(),
  categoria: z.string().trim().max(60).optional().nullable(),
  unidade: z.string().trim().min(1).max(12).default("UN"),
  precoVenda: z.coerce.number().finite().positive().max(999999),
  custoUnitario: z.coerce.number().finite().min(0).max(999999).default(0),
  estoque: z.coerce.number().finite().min(0).max(999999).default(0),
  estoqueMinimo: z.coerce.number().finite().min(0).max(999999).default(0),
  fotoUrl: z.string().url().max(1000).optional().nullable().or(z.literal("")),
});

export async function GET() {
  const usuario = await sessaoApi();
  if (!usuario) return naoAutorizado();

  const produtos = await prisma.produto.findMany({
    where: { tenantId: usuario.tenantId, ativo: true },
    orderBy: { nome: "asc" },
  });
  return NextResponse.json(produtos);
}

export async function POST(req: Request) {
  const usuario = await sessaoApi();
  if (!usuario) return naoAutorizado();
  if (usuario.papel !== "ADMIN") return proibido();

  const parsed = produtoSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ erro: "Confira os campos do produto.", detalhes: parsed.error.flatten() }, { status: 400 });
  }

  const data = parsed.data;
  const produto = await prisma.$transaction(async (tx) => {
    const criado = await tx.produto.create({
      data: {
        tenantId: usuario.tenantId,
        nome: data.nome,
        descricao: data.descricao || null,
        categoria: data.categoria || null,
        unidade: data.unidade,
        precoVenda: data.precoVenda,
        custoUnitario: data.custoUnitario,
        estoque: data.estoque,
        estoqueMinimo: data.estoqueMinimo,
        fotoUrl: data.fotoUrl || null,
      },
    });
    if (data.estoque > 0) {
      await tx.movimentoEstoque.create({
        data: {
          tenantId: usuario.tenantId,
          produtoId: criado.id,
          tipo: "ENTRADA",
          quantidade: data.estoque,
          motivo: "Estoque inicial",
        },
      });
    }
    return criado;
  });

  return NextResponse.json(produto, { status: 201 });
}
