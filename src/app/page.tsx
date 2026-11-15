import Link from "next/link";

const atalhos = [
  ["Pedidos", "/pedidos", "Organize encomendas e acompanhe o preparo."],
  ["Nova venda", "/vendas/nova", "Registre uma venda no balcão."],
  ["Histórico de vendas", "/vendas", "Consulte vendas já registradas."],
  ["Produtos", "/produtos", "Cadastre produtos, preços e estoque."],
  ["Clientes", "/clientes", "Organize seus clientes e contatos."],
  ["Financeiro", "/financeiro", "Registre despesas e acompanhe os gastos."],
];

export default function HomePage() {
  return (
    <main className="mx-auto min-h-screen max-w-6xl p-6 md:p-10">
      <header className="mb-10">
        <p className="text-sm font-semibold uppercase tracking-wider text-orange-600">Gestão do seu negócio</p>
        <h1 className="mt-2 text-4xl font-bold text-slate-900">Salgado Fácil</h1>
        <p className="mt-3 text-slate-600">Pedidos, vendas e controle em um só lugar.</p>
      </header>
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {atalhos.map(([titulo, href, descricao]) => (
          <Link key={href} href={href} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
            <h2 className="text-xl font-semibold">{titulo}</h2>
            <p className="mt-2 text-sm text-slate-600">{descricao}</p>
            <span className="mt-5 inline-block text-sm font-semibold text-orange-600">Acessar →</span>
          </Link>
        ))}
      </section>
      <p className="mt-10 text-sm text-slate-500">Estrutura inicial criada. Os módulos serão conectados ao banco de dados nas próximas etapas.</p>
    </main>
  );
}
