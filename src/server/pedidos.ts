import { Prisma, StatusPedido } from "@prisma/client";
import { prisma } from "@/lib/prisma";

type ItemEntrada = { produtoId: string; quantidade: number };
type PedidoEntrada = {
  clienteId?: string | null;
  clienteNome?: string | null;
  telefone?: string | null;
  observacao?: string | null;
  dataEntrega?: string | null;
  desconto?: number;
  formaPagamento?: "DINHEIRO" | "PIX" | "DEBITO" | "CREDITO" | "TRANSFERENCIA" | null;
  itens: ItemEntrada[];
};

const dinheiro = (n: number) => new Prisma.Decimal(n.toFixed(2));
const quantidade = (n: number) => new Prisma.Decimal(n.toFixed(3));

export async function criarPedido(tenantId: string, entrada: PedidoEntrada) {
  if (!entrada.itens.length) throw new Error("PEDIDO_SEM_ITENS");
  if (entrada.itens.some(i => !Number.isFinite(i.quantidade) || i.quantidade <= 0)) throw new Error("QUANTIDADE_INVALIDA");
  if (!Number.isFinite(entrada.desconto ?? 0) || (entrada.desconto ?? 0) < 0) throw new Error("DESCONTO_INVALIDO");

  return prisma.$transaction(async tx => {
    let subtotal = new Prisma.Decimal(0);
    const itensData: { produtoId: string; descricao: string; quantidade: Prisma.Decimal; precoUnitario: Prisma.Decimal; total: Prisma.Decimal }[] = [];

    for (const item of entrada.itens) {
      const produto = await tx.produto.findFirst({ where: { id: item.produtoId, tenantId, ativo: true } });
      if (!produto) throw new Error("PRODUTO_NAO_ENCONTRADO");
      const qtd = quantidade(item.quantidade);
      const preco = new Prisma.Decimal(produto.precoVenda);
      const total = preco.mul(qtd).toDecimalPlaces(2);
      subtotal = subtotal.add(total);
      itensData.push({ produtoId: produto.id, descricao: produto.nome, quantidade: qtd, precoUnitario: preco, total });
    }

    const desconto = dinheiro(entrada.desconto ?? 0);
    if (desconto.greaterThan(subtotal)) throw new Error("DESCONTO_MAIOR_SUBTOTAL");
    const total = subtotal.sub(desconto).toDecimalPlaces(2);

    if (entrada.clienteId) {
      const cliente = await tx.cliente.findFirst({ where: { id: entrada.clienteId, tenantId } });
      if (!cliente) throw new Error("CLIENTE_NAO_ENCONTRADO");
    }

    const pedido = await tx.pedido.create({
      data: {
        tenantId,
        clienteId: entrada.clienteId || null,
        clienteNome: entrada.clienteNome?.trim() || null,
        telefone: entrada.telefone?.trim() || null,
        observacao: entrada.observacao?.trim() || null,
        dataEntrega: entrada.dataEntrega ? new Date(entrada.dataEntrega) : null,
        subtotal,
        desconto,
        total,
        formaPagamento: entrada.formaPagamento || null,
        itens: { create: itensData },
        historico: { create: { status: StatusPedido.PENDENTE, observacao: "Pedido criado" } },
      },
      include: { itens: true, cliente: true },
    });
    return pedido;
  });
}

const transicoes: Record<StatusPedido, StatusPedido[]> = {
  PENDENTE: [StatusPedido.EM_PREPARO, StatusPedido.CANCELADO],
  EM_PREPARO: [StatusPedido.PRONTO, StatusPedido.CANCELADO],
  PRONTO: [StatusPedido.ENTREGUE, StatusPedido.CANCELADO],
  ENTREGUE: [],
  CANCELADO: [],
};

export async function alterarStatusPedido(tenantId: string, pedidoId: string, statusNovo: StatusPedido, observacao?: string) {
  return prisma.$transaction(async tx => {
    const pedido = await tx.pedido.findFirst({ where: { id: pedidoId, tenantId }, include: { itens: true } });
    if (!pedido) throw new Error("PEDIDO_NAO_ENCONTRADO");
    if (!transicoes[pedido.status].includes(statusNovo)) throw new Error("TRANSICAO_INVALIDA");

    if (statusNovo === StatusPedido.CANCELADO) {
      await tx.pedido.update({ where: { id: pedido.id }, data: { status: statusNovo } });
      await tx.historicoPedido.create({ data: { pedidoId: pedido.id, status: statusNovo, observacao: observacao || "Pedido cancelado" } });
      return { ...pedido, status: statusNovo };
    }

    await tx.pedido.update({ where: { id: pedido.id }, data: { status: statusNovo } });
    await tx.historicoPedido.create({ data: { pedidoId: pedido.id, status: statusNovo, observacao: observacao || null } });
    return { ...pedido, status: statusNovo };
  });
}
