"use client";

import { useCallback,useEffect,useState } from "react";

type Pedido={id:string;clienteNome:string|null;telefone:string|null;status:string;total:string|number;dataEntrega:string|null;itens:{id:string;descricao:string;quantidade:string|number;total:string|number}[]};
const labels:Record<string,string>={PENDENTE:"Pendente",EM_PREPARO:"Em preparo",PRONTO:"Pronto",ENTREGUE:"Entregue",CANCELADO:"Cancelado"};
const next:Record<string,string>={PENDENTE:"EM_PREPARO",EM_PREPARO:"PRONTO",PRONTO:"ENTREGUE"};
const money=(n:number)=>n.toLocaleString("pt-BR",{style:"currency",currency:"BRL"});
export default function PedidosPage(){
 const [items,setItems]=useState<Pedido[]>([]);const [loading,setLoading]=useState(true);const [error,setError]=useState("");const [filter,setFilter]=useState("TODOS");
 const load=useCallback(async()=>{setLoading(true);try{const r=await fetch("/api/pedidos",{cache:"no-store"});const d=await r.json();if(!r.ok)throw new Error(d.erro||"Falha ao carregar pedidos");setItems(d);}catch(e){setError(e instanceof Error?e.message:"Erro ao carregar");}finally{setLoading(false);}},[]);
 useEffect(()=>{void load();},[load]);
 async function change(id:string,status:string){setError("");const r=await fetch(`/api/pedidos/${id}/status`,{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({status})});const d=await r.json();if(!r.ok){setError(d.erro||"Falha ao atualizar");return;}await load();}
 async function cancel(id:string){if(window.confirm("Deseja cancelar este pedido?"))await change(id,"CANCELADO");}
 const list=items.filter(p=>filter==="TODOS"||p.status===filter);
 return <main className="mx-auto max-w-6xl p-5 md:p-10"><a href="/" className="text-sm font-semibold text-orange-600">← Início</a>
 <div className="mt-5 flex flex-wrap items-center justify-between gap-4"><div><h1 className="text-3xl font-bold">Pedidos</h1><p className="mt-2 text-slate-600">Acompanhe encomendas e preparo.</p></div><a href="/pedidos/novo" className="rounded-lg bg-orange-600 px-5 py-3 font-semibold text-white">+ Novo pedido</a></div>
 {error&&<p role="alert" className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}
 <div className="mt-6 flex flex-wrap gap-2">{["TODOS","PENDENTE","EM_PREPARO","PRONTO","ENTREGUE","CANCELADO"].map(s=><button key={s} onClick={()=>setFilter(s)} className={`rounded-full px-4 py-2 text-sm ${filter===s?"bg-orange-600 text-white":"border bg-white"}`}>{s==="TODOS"?"Todos":labels[s]}</button>)}</div>
 {loading?<p className="py-12 text-center text-slate-500">Carregando...</p>:list.length===0?<p className="py-12 text-center text-slate-500">Nenhum pedido encontrado.</p>:<div className="mt-5 grid gap-4 md:grid-cols-2">{list.map(p=><article key={p.id} className="rounded-2xl border bg-white p-5 shadow-sm"><div className="flex justify-between gap-3"><div><p className="font-semibold">{p.clienteNome||"Cliente avulso"}</p><p className="text-sm text-slate-500">{p.telefone||"Sem telefone"}</p></div><span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold">{labels[p.status]||p.status}</span></div><p className="mt-3 text-sm text-slate-500">Entrega: {p.dataEntrega?new Date(p.dataEntrega).toLocaleString("pt-BR"):"Não definida"}</p><ul className="mt-3 space-y-1 text-sm">{p.itens.map(i=><li key={i.id}>{i.quantidade} × {i.descricao} — {money(Number(i.total))}</li>)}</ul><p className="mt-4 text-xl font-bold">{money(Number(p.total))}</p><div className="mt-4 flex flex-wrap gap-2">{next[p.status]&&<button onClick={()=>void change(p.id,next[p.status])} className="rounded-lg bg-orange-600 px-3 py-2 text-sm font-semibold text-white">{p.status==="PENDENTE"?"Iniciar preparo":p.status==="EM_PREPARO"?"Marcar pronto":"Marcar entregue"}</button>}{["PENDENTE","EM_PREPARO","PRONTO"].includes(p.status)&&<button onClick={()=>void cancel(p.id)} className="rounded-lg border px-3 py-2 text-sm text-red-600">Cancelar</button>}</div></article>)}</div>}
 </main>;
}
