import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { naoAutorizado, proibido, sessaoApi } from "@/lib/api-auth";

const atualizarSchema = z.object({
  nome: z.string().trim().min(2).max(100).optional(),
  descricao: z.string().trim().max(500).nullable().optional(),
  categoria: z.string().trim().max(60).nullable().optional(),
  unidade: z.string().trim().min(1).max(12).optional(),
  precoVenda: z.coerce.number().finite().positive().max(999999).optional(),
  custoUnitario: z.coerce.number().finite().min(0).max(999999).optional(),
  estoqueMinimo: z.coerce.number().finite().min(0).max(999999).optional(),
  fotoUrl: z.string().url().max(1000).nullable().optional().or(z.literal("")),
  ajusteEstoque: z.coerce.number().finite().min(-999999).max(999999).optional(),
  motivoAjuste: z.string().trim().max(200).optional(),
});

export async function PATCH(req: Request, context: { params: { id: string } }) {
  const usuario = await sessaoApi();
  if (!usuario) return naoAutorizado();
  if (usuario.papel !== "ADMIN") return proibido();

  const parsed = atualizarSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ erro: "Dados inválidos.", detalhes: parsed.error.flatten() }, { status: 400 });
  }

  const { ajusteEstoque, motivoAjuste, ...campos } = parsed.data;
  if (Object.keys(campos).length === 0 && ajusteEstoque === undefined) {
    return NextResponse.json({ erro: "Nenhuma alteração informada." }, { status: 400 });
  }

  try {
    const atualizado = await prisma.$transaction(async (tx) => {
      const atual = await tx.produto.findFirst({
        where: { id: context.params.id, tenantId: usuario.tenantId, ativo: true },
      });
      if (!atual) return null;

      if (ajusteEstoque !== undefined) {
        const novoEstoque = Number(atual.estoque) + ajusteEstoque;
        if (novoEstoque < 0) throw new Error("ESTOQUE_NEGATIVO");
        await tx.produto.update({
          where: { id: atual.id },
          data: { ...campos, estoque: novoEstoque },
        });
        if (ajusteEstoque !== 0) {
          await tx.movimentoEstoque.create({
            data: {
              tenantId: usuario.tenantId,
              produtoId: atual.id,
              tipo: ajusteEstoque > 0 ? "ENTRADA" : "SAIDA",
              quantidade: Math.abs(ajusteEstoque),
              motivo: motivoAjuste || "Ajuste manual de estoque",
            },
          });
        }
      } else {
        await tx.produto.update({ where: { id: atual.id }, data: campos });
      }

      return tx.produto.findUnique({ where: { id: atual.id } });
    });

    if (!atualizado) return NextResponse.json({ erro: "Produto não encontrado." }, { status: 404 });
    return NextResponse.json(atualizado);
  } catch (error) {
    if (error instanceof Error && error.message === "ESTOQUE_NEGATIVO") {
      return NextResponse.json({ erro: "O ajuste não pode deixar o estoque negativo." }, { status: 400 });
    }
    throw error;
  }
}

export async function DELETE(_req: Request, context: { params: { id: string } }) {
  const usuario = await sessaoApi();
  if (!usuario) return naoAutorizado();
  if (usuario.papel !== "ADMIN") return proibido();

  const resultado = await prisma.produto.updateMany({
    where: { id: context.params.id, tenantId: usuario.tenantId, ativo: true },
    data: { ativo: false },
  });
  if (resultado.count === 0) return NextResponse.json({ erro: "Produto não encontrado." }, { status: 404 });
  return NextResponse.json({ sucesso: true });
}
