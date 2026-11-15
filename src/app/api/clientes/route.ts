import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { naoAutorizado, sessaoApi } from "@/lib/api-auth";

const clienteSchema = z.object({
  nome: z.string().trim().min(2).max(120),
  telefone: z.string().trim().max(30).optional().nullable(),
  email: z.string().trim().email().max(160).optional().nullable().or(z.literal("")),
  endereco: z.string().trim().max(300).optional().nullable(),
});

export async function GET() {
  const usuario = await sessaoApi();
  if (!usuario) return naoAutorizado();
  const clientes = await prisma.cliente.findMany({
    where: { tenantId: usuario.tenantId },
    orderBy: { nome: "asc" },
  });
  return NextResponse.json(clientes);
}

export async function POST(req: Request) {
  const usuario = await sessaoApi();
  if (!usuario) return naoAutorizado();
  const parsed = clienteSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ erro: "Confira os dados do cliente.", detalhes: parsed.error.flatten() }, { status: 400 });
  }
  const cliente = await prisma.cliente.create({
    data: {
      tenantId: usuario.tenantId,
      nome: parsed.data.nome,
      telefone: parsed.data.telefone || null,
      email: parsed.data.email || null,
      endereco: parsed.data.endereco || null,
    },
  });
  return NextResponse.json(cliente, { status: 201 });
}
