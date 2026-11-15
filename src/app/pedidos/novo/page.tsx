"use client";

import { FormEvent, useEffect, useState } from "react";

type Produto = { id: string; nome: string; unidade: string; precoVenda: string | number; estoque: string | number };
type Cliente = { id: string; nome: string; telefone: string | null };
type Linha = { produtoId: string; quantidade: number };

const fmt=(n:number)=>n.toLocaleString("pt-BR",{style:"currency",currency:"BRL"});

export default function NovoPedidoPage(){
  const [produtos,setProdutos]=useState<Produto[]>([]);
  const [clientes,setClientes]=useState<Cliente[]>([]);
  const [clienteId,setClienteId]=useState("");
  const [clienteNome,setClienteNome]=useState("");
  const [telefone,setTelefone]=useState("");
  const [dataEntrega,setDataEntrega]=useState("");
  const [observacao,setObservacao]=useState("");
  const [desconto,setDesconto]=useState("0");
  const [itens,setItens]=useState<Linha[]>([]);
  const [produtoId,setProdutoId]=useState("");
  const [quantidade,setQuantidade]=useState("1");
  const [erro,setErro]=useState("");
  const [salvando,setSalvando]=useState(false);

  useEffect(()=>{Promise.all([fetch("/api/produtos").then(r=>r.json()),fetch("/api/clientes").then(r=>r.json())]).then(([p,c])=>{setProdutos(p);setClientes(c);}).catch(()=>setErro("Não foi possível carregar produtos e clientes."));},[]);
  const subtotal=itens.reduce((s,i)=>{const p=produtos.find(p=>p.id===i.produtoId);return s+(p?Number(p.precoVenda)*i.quantidade:0);},0);
  const desc=Number(desconto)||0;
  const total=Math.max(0,subtotal-desc);

  function adicionar(){
    if(!produtoId||Number(quantidade)<=0){setErro("Escolha um produto e uma quantidade válida.");return;}
    setErro("");
    setItens(prev=>{const atual=prev.find(i=>i.produtoId===produtoId);return atual?prev.map(i=>i.produtoId===produtoId?{...i,quantidade:i.quantidade+Number(quantidade)}:i):[...prev,{produtoId,quantidade:Number(quantidade)}];});
    setProdutoId("");setQuantidade("1");
  }
  async function salvar(e:FormEvent<HTMLFormElement>){
    e.preventDefault();setErro("");
    if(!itens.length){setErro("Adicione pelo menos um item ao pedido.");return;}
    if(desc<0||desc>subtotal){setErro("Desconto deve ser igual ou menor que o subtotal.");return;}
    setSalvando(true);
    try{
      const r=await fetch("/api/pedidos",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({clienteId:clienteId||null,clienteNome:clienteNome||null,telefone:telefone||null,dataEntrega:dataEntrega?new Date(dataEntrega).toISOString():null,observacao,desconto:desc,itens})});
      const d=await r.json();if(!r.ok)throw new Error(d.erro||"Falha ao criar pedido.");
      window.location.href="/pedidos";
    }catch(e){setErro(e instanceof Error?e.message:"Erro ao salvar pedido.");}finally{setSalvando(false);}
  }
  return <main className="mx-auto max-w-5xl p-5 md:p-10">
    <a href="/pedidos" className="text-sm font-semibold text-orange-600">← Voltar aos pedidos</a>
    <h1 className="mt-5 text-3xl font-bold">Novo pedido</h1>
    <p className="mt-2 text-slate-600">Registre uma encomenda para preparar e entregar.</p>
    {erro&&<p role="alert" className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">{erro}</p>}
    <form onSubmit={salvar} className="mt-6 space-y-6">
      <section className="grid gap-4 rounded-2xl border bg-white p-5 sm:grid-cols-2">
        <label className="text-sm font-medium">Cliente cadastrado
          <select value={clienteId} onChange={e=>{setClienteId(e.target.value);const c=clientes.find(c=>c.id===e.target.value);if(c){setClienteNome(c.nome);setTelefone(c.telefone||"");}}} className="mt-1 w-full rounded-lg border bg-white p-3"><option value="">Cliente avulso / informar abaixo</option>{clientes.map(c=><option key={c.id} value={c.id}>{c.nome}</option>)}</select>
        </label>
        <label className="text-sm font-medium">Nome do cliente<input value={clienteNome} onChange={e=>setClienteNome(e.target.value)} className="mt-1 w-full rounded-lg border p-3"/></label>
        <label className="text-sm font-medium">Telefone<input value={telefone} onChange={e=>setTelefone(e.target.value)} className="mt-1 w-full rounded-lg border p-3"/></label>
        <label className="text-sm font-medium">Data e hora de entrega<input type="datetime-local" value={dataEntrega} onChange={e=>setDataEntrega(e.target.value)} className="mt-1 w-full rounded-lg border p-3"/></label>
        <label className="text-sm font-medium sm:col-span-2">Observações<textarea value={observacao} onChange={e=>setObservacao(e.target.value)} className="mt-1 w-full rounded-lg border p-3" rows={2}/></label>
      </section>
      <section className="rounded-2xl border bg-white p-5">
        <h2 className="text-lg font-semibold">Itens do pedido</h2>
        <div className="mt-4 flex flex-col gap-3 sm:flex-row">
          <select value={produtoId} onChange={e=>setProdutoId(e.target.value)} className="flex-1 rounded-lg border bg-white p-3"><option value="">Selecione um produto</option>{produtos.map(p=><option key={p.id} value={p.id}>{p.nome} — {fmt(Number(p.precoVenda))} / {p.unidade}</option>)}</select>
          <input type="number" min="0.001" step="0.001" value={quantidade} onChange={e=>setQuantidade(e.target.value)} className="w-full rounded-lg border p-3 sm:w-32" aria-label="Quantidade"/>
          <button type="button" onClick={adicionar} className="rounded-lg border px-5 py-3 font-semibold hover:bg-slate-50">Adicionar</button>
        </div>
        {itens.length===0?<p className="py-5 text-sm text-slate-500">Nenhum item adicionado.</p>:<div className="mt-4 divide-y">{itens.map(i=>{const p=produtos.find(p=>p.id===i.produtoId);return <div key={i.produtoId} className="flex items-center justify-between gap-3 py-3"><div><p className="font-medium">{p?.nome}</p><p className="text-sm text-slate-500">{i.quantidade} × {fmt(Number(p?.precoVenda||0))}</p></div><div className="flex items-center gap-3"><strong>{fmt(i.quantidade*Number(p?.precoVenda||0))}</strong><button type="button" onClick={()=>setItens(prev=>prev.filter(x=>x.produtoId!==i.produtoId))} className="text-red-600">Remover</button></div></div>;})}</div>}
        <label className="mt-5 block max-w-xs text-sm font-medium">Desconto (R$)<input type="number" min="0" step="0.01" value={desconto} onChange={e=>setDesconto(e.target.value)} className="mt-1 w-full rounded-lg border p-3"/></label>
        <div className="mt-5 rounded-lg bg-slate-50 p-4 text-right"><p className="text-sm text-slate-600">Subtotal: {fmt(subtotal)}</p><p className="text-sm text-slate-600">Desconto: {fmt(desc)}</p><p className="mt-1 text-2xl font-bold">Total: {fmt(total)}</p></div>
      </section>
      <button disabled={salvando} className="w-full rounded-lg bg-orange-600 px-5 py-4 font-semibold text-white disabled:opacity-60">{salvando?"Salvando pedido...":"Criar pedido"}</button>
    </form>
  </main>;
}
