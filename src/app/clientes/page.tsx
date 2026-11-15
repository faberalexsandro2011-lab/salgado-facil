"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";

type Cliente = { id: string; nome: string; telefone: string | null; email: string | null; endereco: string | null };

export default function ClientesPage() {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [nome, setNome] = useState("");
  const [telefone, setTelefone] = useState("");
  const [email, setEmail] = useState("");
  const [endereco, setEndereco] = useState("");
  const [erro, setErro] = useState("");
  const [aviso, setAviso] = useState("");
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);

  const carregar = useCallback(async () => {
    setCarregando(true);
    try {
      const r = await fetch("/api/clientes", { cache: "no-store" });
      const d = await r.json();
      if (!r.ok) throw new Error(d.erro || "Falha ao carregar clientes.");
      setClientes(d);
    } catch (e) { setErro(e instanceof Error ? e.message : "Erro ao carregar."); }
    finally { setCarregando(false); }
  }, []);

  useEffect(() => { void carregar(); }, [carregar]);

  async function salvar(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSalvando(true); setErro(""); setAviso("");
    try {
      const r = await fetch("/api/clientes", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nome, telefone, email, endereco }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.erro || "Falha ao salvar cliente.");
      setNome(""); setTelefone(""); setEmail(""); setEndereco("");
      setAviso("Cliente cadastrado com sucesso.");
      await carregar();
    } catch (e) { setErro(e instanceof Error ? e.message : "Erro ao salvar."); }
    finally { setSalvando(false); }
  }

  return <main className="mx-auto max-w-5xl p-5 md:p-10">
    <a href="/" className="text-sm font-semibold text-orange-600">← Voltar ao início</a>
    <h1 className="mt-5 text-3xl font-bold">Clientes</h1>
    <p className="mt-2 text-slate-600">Cadastre e consulte os clientes do seu negócio.</p>
    {erro && <p role="alert" className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">{erro}</p>}
    {aviso && <p role="status" className="mt-4 rounded-lg bg-green-50 p-3 text-sm text-green-700">{aviso}</p>}
    <form onSubmit={salvar} className="mt-6 grid gap-4 rounded-2xl border bg-white p-5 sm:grid-cols-2">
      <label className="text-sm font-medium">Nome<input required minLength={2} value={nome} onChange={e=>setNome(e.target.value)} className="mt-1 w-full rounded-lg border p-3"/></label>
      <label className="text-sm font-medium">Telefone<input value={telefone} onChange={e=>setTelefone(e.target.value)} className="mt-1 w-full rounded-lg border p-3"/></label>
      <label className="text-sm font-medium">E-mail<input type="email" value={email} onChange={e=>setEmail(e.target.value)} className="mt-1 w-full rounded-lg border p-3"/></label>
      <label className="text-sm font-medium">Endereço<input value={endereco} onChange={e=>setEndereco(e.target.value)} className="mt-1 w-full rounded-lg border p-3"/></label>
      <button disabled={salvando} className="rounded-lg bg-orange-600 px-5 py-3 font-semibold text-white disabled:opacity-60 sm:col-span-2">{salvando ? "Salvando..." : "Cadastrar cliente"}</button>
    </form>
    <section className="mt-8 rounded-2xl border bg-white p-5">
      <h2 className="text-xl font-semibold">Clientes cadastrados</h2>
      {carregando ? <p className="py-6 text-slate-500">Carregando...</p> : clientes.length === 0 ? <p className="py-6 text-slate-500">Nenhum cliente cadastrado.</p> :
      <div className="mt-4 divide-y">{clientes.map(c=><article key={c.id} className="py-3"><p className="font-semibold">{c.nome}</p><p className="text-sm text-slate-600">{[c.telefone,c.email,c.endereco].filter(Boolean).join(" · ") || "Sem contato informado"}</p></article>)}</div>}
    </section>
  </main>;
}
