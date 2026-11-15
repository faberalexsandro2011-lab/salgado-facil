"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";

type Produto = {
  id: string;
  nome: string;
  categoria: string | null;
  unidade: string;
  precoVenda: string | number;
  custoUnitario: string | number;
  estoque: string | number;
  estoqueMinimo: string | number;
};

const vazio = {
  nome: "",
  categoria: "",
  unidade: "UN",
  precoVenda: "",
  custoUnitario: "0",
  estoque: "0",
  estoqueMinimo: "0",
};

const moeda = (valor: string | number) =>
  Number(valor).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export default function ProdutosPage() {
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [form, setForm] = useState(vazio);
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState("");
  const [mensagem, setMensagem] = useState("");

  const carregar = useCallback(async () => {
    setCarregando(true);
    setErro("");
    try {
      const resposta = await fetch("/api/produtos", { cache: "no-store" });
      const dados = await resposta.json();
      if (!resposta.ok) throw new Error(dados.erro || "Não foi possível carregar os produtos.");
      setProdutos(dados);
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Erro ao carregar produtos.");
    } finally {
      setCarregando(false);
    }
  }, []);

  useEffect(() => { void carregar(); }, [carregar]);

  async function cadastrar(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSalvando(true);
    setErro("");
    setMensagem("");
    try {
      const resposta = await fetch("/api/produtos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          precoVenda: Number(form.precoVenda),
          custoUnitario: Number(form.custoUnitario),
          estoque: Number(form.estoque),
          estoqueMinimo: Number(form.estoqueMinimo),
        }),
      });
      const dados = await resposta.json();
      if (!resposta.ok) throw new Error(dados.erro || "Não foi possível cadastrar.");
      setForm(vazio);
      setMensagem("Produto cadastrado com sucesso.");
      await carregar();
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Erro ao cadastrar produto.");
    } finally {
      setSalvando(false);
    }
  }

  async function editarProduto(produto: Produto) {
    const nome = window.prompt("Nome do produto:", produto.nome);
    if (nome === null) return;
    const precoTexto = window.prompt("Preço de venda (R$):", String(produto.precoVenda).replace(".", ","));
    if (precoTexto === null) return;
    const precoVenda = Number(precoTexto.replace(",", "."));
    if (!nome.trim() || !Number.isFinite(precoVenda) || precoVenda <= 0) {
      setErro("Informe um nome e um preço válido.");
      return;
    }
    const resposta = await fetch(`/api/produtos/${produto.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nome: nome.trim(), precoVenda }),
    });
    const dados = await resposta.json();
    if (!resposta.ok) { setErro(dados.erro || "Não foi possível atualizar."); return; }
    setMensagem("Produto atualizado.");
    await carregar();
  }

  async function ajustarEstoque(produto: Produto) {
    const texto = window.prompt("Quantidade para adicionar (positivo) ou retirar (negativo):", "0");
    if (texto === null) return;
    const ajusteEstoque = Number(texto.replace(",", "."));
    if (!Number.isFinite(ajusteEstoque) || ajusteEstoque === 0) {
      setErro("Informe uma quantidade diferente de zero.");
      return;
    }
    const motivoAjuste = window.prompt("Motivo do ajuste:", "Ajuste manual") || "Ajuste manual";
    const resposta = await fetch(`/api/produtos/${produto.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ajusteEstoque, motivoAjuste }),
    });
    const dados = await resposta.json();
    if (!resposta.ok) { setErro(dados.erro || "Não foi possível ajustar o estoque."); return; }
    setMensagem("Estoque ajustado e movimentação registrada.");
    await carregar();
  }

  async function inativar(id: string) {
    if (!window.confirm("Deseja realmente retirar este produto da lista ativa?")) return;
    setErro("");
    setMensagem("");
    const resposta = await fetch(`/api/produtos/${id}`, { method: "DELETE" });
    const dados = await resposta.json();
    if (!resposta.ok) {
      setErro(dados.erro || "Não foi possível inativar o produto.");
      return;
    }
    setMensagem("Produto inativado.");
    await carregar();
  }

  return (
    <main className="mx-auto max-w-6xl p-5 md:p-10">
      <a href="/" className="text-sm font-semibold text-orange-600">← Voltar ao início</a>
      <header className="mb-7 mt-5">
        <h1 className="text-3xl font-bold text-slate-900">Produtos e estoque</h1>
        <p className="mt-2 text-slate-600">Cadastre produtos, custos, preços de venda e estoque mínimo.</p>
      </header>

      {erro && <p role="alert" className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">{erro}</p>}
      {mensagem && <p role="status" className="mb-4 rounded-lg bg-green-50 p-3 text-sm text-green-700">{mensagem}</p>}

      <section className="mb-8 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="mb-4 text-xl font-semibold">Cadastrar produto</h2>
        <form onSubmit={cadastrar} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <label className="sm:col-span-2 text-sm font-medium">Nome do produto
            <input required minLength={2} maxLength={100} value={form.nome} onChange={e => setForm({ ...form, nome: e.target.value })} className="mt-1 w-full rounded-lg border p-3" placeholder="Ex.: Coxinha de frango" />
          </label>
          <label className="text-sm font-medium">Categoria
            <input value={form.categoria} onChange={e => setForm({ ...form, categoria: e.target.value })} className="mt-1 w-full rounded-lg border p-3" placeholder="Ex.: Fritos" />
          </label>
          <label className="text-sm font-medium">Unidade
            <select value={form.unidade} onChange={e => setForm({ ...form, unidade: e.target.value })} className="mt-1 w-full rounded-lg border bg-white p-3">
              <option value="UN">Unidade</option><option value="CENTO">Cento</option><option value="KG">Kg</option><option value="PACOTE">Pacote</option><option value="BANDEJA">Bandeja</option>
            </select>
          </label>
          <label className="text-sm font-medium">Preço de venda (R$)
            <input required type="number" min="0.01" step="0.01" value={form.precoVenda} onChange={e => setForm({ ...form, precoVenda: e.target.value })} className="mt-1 w-full rounded-lg border p-3" />
          </label>
          <label className="text-sm font-medium">Custo unitário (R$)
            <input type="number" min="0" step="0.01" value={form.custoUnitario} onChange={e => setForm({ ...form, custoUnitario: e.target.value })} className="mt-1 w-full rounded-lg border p-3" />
          </label>
          <label className="text-sm font-medium">Estoque inicial
            <input type="number" min="0" step="0.001" value={form.estoque} onChange={e => setForm({ ...form, estoque: e.target.value })} className="mt-1 w-full rounded-lg border p-3" />
          </label>
          <label className="text-sm font-medium">Estoque mínimo
            <input type="number" min="0" step="0.001" value={form.estoqueMinimo} onChange={e => setForm({ ...form, estoqueMinimo: e.target.value })} className="mt-1 w-full rounded-lg border p-3" />
          </label>
          <div className="flex items-end">
            <button disabled={salvando} className="w-full rounded-lg bg-orange-600 px-5 py-3 font-semibold text-white hover:bg-orange-700 disabled:opacity-60">{salvando ? "Salvando..." : "Cadastrar produto"}</button>
          </div>
        </form>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-xl font-semibold">Produtos cadastrados</h2>
          <button onClick={() => void carregar()} className="rounded-lg border px-4 py-2 text-sm font-medium hover:bg-slate-50">Atualizar lista</button>
        </div>
        {carregando ? <p className="py-8 text-center text-slate-500">Carregando produtos...</p> :
          produtos.length === 0 ? <p className="py-8 text-center text-slate-500">Nenhum produto cadastrado.</p> :
          <div className="overflow-x-auto">
            <table className="w-full min-w-[680px] text-left text-sm">
              <thead><tr className="border-b text-slate-500"><th className="p-3">Produto</th><th className="p-3">Preço</th><th className="p-3">Custo</th><th className="p-3">Estoque</th><th className="p-3">Mínimo</th><th className="p-3">Ações</th></tr></thead>
              <tbody>{produtos.map(p => {
                const baixo = Number(p.estoque) <= Number(p.estoqueMinimo);
                return <tr key={p.id} className="border-b last:border-0">
                  <td className="p-3"><span className="font-semibold">{p.nome}</span><span className="block text-xs text-slate-500">{p.categoria || "Sem categoria"} · {p.unidade}</span></td>
                  <td className="p-3">{moeda(p.precoVenda)}</td>
                  <td className="p-3">{moeda(p.custoUnitario)}</td>
                  <td className="p-3"><span className={baixo ? "font-semibold text-red-600" : ""}>{Number(p.estoque).toLocaleString("pt-BR")}</span></td>
                  <td className="p-3">{Number(p.estoqueMinimo).toLocaleString("pt-BR")}</td>
                  <td className="p-3"><div className="flex flex-wrap gap-3"><button onClick={() => void editarProduto(p)} className="font-medium text-blue-700 hover:underline">Editar</button><button onClick={() => void ajustarEstoque(p)} className="font-medium text-orange-700 hover:underline">Estoque</button><button onClick={() => void inativar(p.id)} className="text-red-600 hover:underline">Inativar</button></div></td>
                </tr>;
              })}</tbody>
            </table>
          </div>}
      </section>
    </main>
  );
}
