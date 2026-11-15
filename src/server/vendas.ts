import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

type VendaEntrada = {
  clienteId?: string | null;
  formaPagamento: "DINHEIRO" | "PIX" | "DEBITO" | "CREDITO" | "TRANSFERENCIA";
  desconto?: number;
  itens: { produtoId: string; quantidade: number }[];
};

export async function registrarVenda(tenantId: string, entrada: VendaEntrada) {
  if (!entrada.itens.length) throw new Error("VENDA_SEM_ITENS");
  if (entrada.itens.some(i => !Number.isFinite(i.quantidade) || i.quantidade <= 0)) throw new Error("QUANTIDADE_INVALIDA");
  const descontoNum = entrada.desconto ?? 0;
  if (!Number.isFinite(descontoNum) || descontoNum < 0) throw new Error("DESCONTO_INVALIDO");

  return prisma.$transaction(async tx => {
    let subtotal = new Prisma.Decimal(0);
    const linhas: { produtoId: string; descricao: string; quantidade: Prisma.Decimal; precoUnitario: Prisma.Decimal; total: Prisma.Decimal }[] = [];
    for (const item of entrada.itens) {
      const produto = await tx.produto.findFirst({ where: { id: item.produtoId, tenantId, ativo: true } });
      if (!produto) throw new Error("PRODUTO_NAO_ENCONTRADO");
      const qtd = new Prisma.Decimal(item.quantidade.toFixed(3));
      const preco = new Prisma.Decimal(produto.precoVenda);
      const total = preco.mul(qtd).toDecimalPlaces(2);
      subtotal = subtotal.add(total);
      linhas.push({ produtoId: produto.id, descricao: produto.nome, quantidade: qtd, precoUnitario: preco, total });
    }
    const desconto = new Prisma.Decimal(descontoNum.toFixed(2));
    if (desconto.greaterThan(subtotal)) throw new Error("DESCONTO_MAIOR_SUBTOTAL");
    const total = subtotal.sub(desconto).toDecimalPlaces(2);

    if (entrada.clienteId && !await tx.cliente.findFirst({ where: { id: entrada.clienteId, tenantId } })) {
      throw new Error("CLIENTE_NAO_ENCONTRADO");
    }

    // Cada produto é debitado com atualização condicional para evitar estoque negativo
    for (const linha of linhas) {
      const atualizacao = await tx.produto.updateMany({
        where: { id: linha.produtoId, tenantId, ativo: true, estoque: { gte: linha.quantidade } },
        data: { estoque: { decrement: linha.quantidade } },
      });
      if (atualizacao.count !== 1) throw new Error("ESTOQUE_INSUFICIENTE");
      await tx.movimentoEstoque.create({
        data: { tenantId, produtoId: linha.produtoId, tipo: "SAIDA", quantidade: linha.quantidade, motivo: "Venda" },
      });
    }

    return tx.venda.create({
      data: {
        tenantId, clienteId: entrada.clienteId || null, subtotal, desconto, total,
        formaPagamento: entrada.formaPagamento, recebido: true, itens: { create: linhas },
      },
      include: { itens: true, cliente: true },
    });
  });
}
