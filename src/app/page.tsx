"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type Dashboard = {
  vendasHoje: { total: number; quantidade: number };
  vendasMes: { total: number; quantidade: number };
  despesasMes: number;
  saldoEstimado: number;
  pedidosPendentes: number;
  estoqueBaixo: { id: string; nome: string; estoque: string | number; estoqueMinimo: string | number }[];
  maisVendidos: { descricao: string; quantidade: number; total: number }[];
  vendasRecentes: { id: string; total: number; formaPagamento: string; criadoEm: string; cliente: string }[];
};

const brl = (valor: number) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(valor);
const pagamento: Record<string, string> = { DINHEIRO: "Dinheiro", PIX: "Pix", DEBITO: "Débito", CREDITO: "Crédito", TRANSFERENCIA: "Transferência" };

export default function HomePage() {
  const [dados, setDados] = useState<Dashboard | null>(null);
  const [erro, setErro] = useState("");
  useEffect(() => {
    fetch("/api/dashboard").then(async (r) => {
      if (!r.ok) throw new Error("Não foi possível carregar o painel. Entre novamente na sua conta.");
      return r.json();
    }).then(setDados).catch((e) => setErro(e.message));
  }, []);

  const cards = dados ? [
    ["Vendas de hoje", brl(dados.vendasHoje.total), dados.vendasHoje.quantidade + " venda(s)"],
    ["Vendas do mês", brl(dados.vendasMes.total), dados.vendasMes.quantidade + " venda(s)"],
    ["Despesas do mês", brl(dados.despesasMes), "Despesas registradas"],
    ["Saldo estimado", brl(dados.saldoEstimado), "Vendas recebidas menos despesas"],
    ["Pedidos em andamento", String(dados.pedidosPendentes), "Pendentes, em preparo ou prontos"],
  ] : [];

  return (
    <main className="mx-auto min-h-screen max-w-6xl p-6 md:p-10">
      <header className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wider text-orange-600">Gestão do seu negócio</p>
          <h1 className="mt-2 text-4xl font-bold text-slate-900">Salgado Fácil</h1>
          <p className="mt-3 text-slate-600">Resumo das vendas, despesas, pedidos e estoque.</p>
        </div>
        <Link href="/vendas/nova" className="rounded-xl bg-orange-600 px-5 py-3 font-semibold text-white hover:bg-orange-700">+ Nova venda</Link>
      </header>

      {erro && <p className="mb-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{erro}</p>}
      {!dados && !erro && <p className="mb-5 text-slate-500">Carregando indicadores...</p>}

      <section className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map(([titulo, valor, detalhe]) => (
          <article key={titulo} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">{titulo}</p>
            <p className="mt-2 text-2xl font-bold text-slate-900">{valor}</p>
            <p className="mt-1 text-xs text-slate-500">{detalhe}</p>
          </article>
        ))}
      </section>

      <section className="mb-8 grid gap-6 lg:grid-cols-2">
        <article className="rounded-2xl border border-slate-200 bg-white p-6">
          <div className="mb-4 flex items-center justify-between"><h2 className="text-lg font-bold">Produtos mais vendidos</h2><span className="text-xs text-slate-500">Este mês</span></div>
          {!dados?.maisVendidos.length ? <p className="text-sm text-slate-500">Ainda não há vendas neste mês.</p> : <div className="space-y-3">{dados.maisVendidos.map((item) => <div key={item.descricao} className="flex items-center justify-between gap-3 border-b border-slate-100 pb-3"><div><p className="font-medium">{item.descricao}</p><p className="text-xs text-slate-500">{item.quantidade} unidade(s)</p></div><strong className="text-sm">{brl(item.total)}</strong></div>)}</div>}
        </article>
        <article className="rounded-2xl border border-slate-200 bg-white p-6">
          <div className="mb-4 flex items-center justify-between"><h2 className="text-lg font-bold">Estoque baixo</h2><Link href="/produtos" className="text-sm font-semibold text-orange-600">Ver produtos</Link></div>
          {!dados?.estoqueBaixo.length ? <p className="text-sm text-slate-500">Nenhum produto abaixo do mínimo.</p> : <div className="space-y-3">{dados.estoqueBaixo.map((item) => <div key={item.id} className="flex justify-between gap-3 border-b border-slate-100 pb-3"><span className="font-medium">{item.nome}</span><span className="text-sm text-orange-700">Estoque: {Number(item.estoque)} / mín. {Number(item.estoqueMinimo)}</span></div>)}</div>}
        </article>
      </section>

      <section className="mb-8 rounded-2xl border border-slate-200 bg-white p-6">
        <div className="mb-4 flex items-center justify-between"><h2 className="text-lg font-bold">Vendas recentes</h2><Link href="/vendas" className="text-sm font-semibold text-orange-600">Ver histórico</Link></div>
        {!dados?.vendasRecentes.length ? <p className="text-sm text-slate-500">Nenhuma venda registrada ainda.</p> : <div className="overflow-x-auto"><table className="w-full text-left text-sm"><thead className="text-slate-500"><tr><th className="pb-3">Data</th><th className="pb-3">Cliente</th><th className="pb-3">Pagamento</th><th className="pb-3 text-right">Total</th></tr></thead><tbody>{dados.vendasRecentes.map((v) => <tr key={v.id} className="border-t border-slate-100"><td className="py-3">{new Date(v.criadoEm).toLocaleString("pt-BR")}</td><td className="py-3">{v.cliente}</td><td className="py-3">{pagamento[v.formaPagamento] ?? v.formaPagamento}</td><td className="py-3 text-right font-semibold">{brl(v.total)}</td></tr>)}</tbody></table></div>}
      </section>

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {[
          ["Pedidos", "/pedidos", "Organize encomendas e acompanhe o preparo."],
          ["Nova venda", "/vendas/nova", "Registre uma venda no balcão."],
          ["Histórico de vendas", "/vendas", "Consulte vendas já registradas."],
          ["Produtos", "/produtos", "Cadastre produtos, preços e estoque."],
          ["Clientes", "/clientes", "Organize seus clientes e contatos."],
          ["Financeiro", "/financeiro", "Registre despesas e acompanhe os gastos."],
        ].map(([titulo, href, descricao]) => <Link key={href} href={href} className="rounded-xl border border-slate-200 bg-white p-5 transition hover:border-orange-300"><h2 className="font-semibold">{titulo}</h2><p className="mt-1 text-sm text-slate-600">{descricao}</p><span className="mt-3 inline-block text-sm font-semibold text-orange-600">Acessar →</span></Link>)}
      </section>
      <p className="mt-8 text-xs text-slate-400">Saldo estimado = vendas recebidas menos despesas cadastradas. Não representa lucro líquido, pois ainda não desconta o custo dos produtos.</p>
    </main>
  );
}
