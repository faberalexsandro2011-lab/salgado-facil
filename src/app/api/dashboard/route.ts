import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { naoAutorizado, sessaoApi } from "@/lib/api-auth";

export async function GET() {
  const user = await sessaoApi();
  if (!user) return naoAutorizado();

  // Os limites do dia e do mês consideram o horário de Brasília.
  const agora = new Date();
  const brasil = new Date(agora.getTime() - 3 * 60 * 60 * 1000);
  const inicioDia = new Date(Date.UTC(brasil.getUTCFullYear(), brasil.getUTCMonth(), brasil.getUTCDate(), 3));
  const inicioMes = new Date(Date.UTC(brasil.getUTCFullYear(), brasil.getUTCMonth(), 1, 3));

  const [vendasHoje, vendasMes, despesasMes, pedidosPendentes, estoqueBaixo, maisVendidos, vendasRecentes] = await Promise.all([
    prisma.venda.aggregate({ where: { tenantId: user.tenantId, recebido: true, criadoEm: { gte: inicioDia } }, _sum: { total: true }, _count: { _all: true } }),
    prisma.venda.aggregate({ where: { tenantId: user.tenantId, recebido: true, criadoEm: { gte: inicioMes } }, _sum: { total: true }, _count: { _all: true } }),
    prisma.despesa.aggregate({ where: { tenantId: user.tenantId, data: { gte: inicioMes } }, _sum: { valor: true } }),
    prisma.pedido.count({ where: { tenantId: user.tenantId, status: { in: ["PENDENTE", "EM_PREPARO", "PRONTO"] } } }),
    prisma.produto.findMany({ where: { tenantId: user.tenantId, ativo: true, estoque: { lte: prisma.produto.fields.estoqueMinimo } }, select: { id: true, nome: true, estoque: true, estoqueMinimo: true }, orderBy: { nome: "asc" }, take: 8 }),
    prisma.itemVenda.groupBy({ by: ["descricao"], where: { venda: { tenantId: user.tenantId, recebido: true, criadoEm: { gte: inicioMes } } }, _sum: { quantidade: true, total: true }, orderBy: { _sum: { total: "desc" } }, take: 5 }),
    prisma.venda.findMany({ where: { tenantId: user.tenantId }, include: { cliente: true }, orderBy: { criadoEm: "desc" }, take: 5, select: { id: true, total: true, formaPagamento: true, criadoEm: true, cliente: { select: { nome: true } } } }),
  ]);

  const receitaMes = Number(vendasMes._sum.total ?? 0);
  const totalDespesas = Number(despesasMes._sum.valor ?? 0);
  return NextResponse.json({
    vendasHoje: { total: Number(vendasHoje._sum.total ?? 0), quantidade: vendasHoje._count._all },
    vendasMes: { total: receitaMes, quantidade: vendasMes._count._all },
    despesasMes: totalDespesas,
    saldoEstimado: receitaMes - totalDespesas,
    pedidosPendentes,
    estoqueBaixo,
    maisVendidos: maisVendidos.map((item) => ({ descricao: item.descricao, quantidade: Number(item._sum.quantidade ?? 0), total: Number(item._sum.total ?? 0) })),
    vendasRecentes: vendasRecentes.map((venda) => ({ ...venda, total: Number(venda.total), cliente: venda.cliente?.nome ?? "Venda balcão" })),
  });
}
