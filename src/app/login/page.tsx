"use client";

import { FormEvent, useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState("");
  const [carregando, setCarregando] = useState(false);

  async function entrar(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErro("");
    setCarregando(true);
    const result = await signIn("credentials", {
      email,
      senha,
      redirect: false,
    });
    setCarregando(false);
    if (result?.error) {
      setErro("E-mail ou senha inválidos. Confira os dados e tente novamente.");
      return;
    }
    router.replace("/");
    router.refresh();
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-100 p-5">
      <form onSubmit={entrar} className="w-full max-w-md rounded-2xl bg-white p-8 shadow-lg">
        <p className="text-sm font-bold uppercase tracking-wider text-orange-600">Salgado Fácil</p>
        <h1 className="mt-3 text-2xl font-bold text-slate-900">Acessar sua conta</h1>
        <p className="mt-2 text-sm text-slate-600">Entre com seu e-mail e sua senha.</p>
        <label className="mt-6 block text-sm font-medium">E-mail</label>
        <input required type="email" autoComplete="username" value={email} onChange={e => setEmail(e.target.value)} className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-3 outline-none focus:border-orange-500" />
        <label className="mt-4 block text-sm font-medium">Senha</label>
        <input required type="password" autoComplete="current-password" value={senha} onChange={e => setSenha(e.target.value)} className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-3 outline-none focus:border-orange-500" />
        {erro && <p role="alert" className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">{erro}</p>}
        <button disabled={carregando} className="mt-6 w-full rounded-lg bg-orange-600 px-4 py-3 font-semibold text-white hover:bg-orange-700 disabled:opacity-60">
          {carregando ? "Entrando..." : "Entrar"}
        </button>
      </form>
    </main>
  );
}
