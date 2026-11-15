import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { registrarVenda } from "@/server/vendas";
import { naoAutorizado, sessaoApi } from "@/lib/api-auth";

const schema=z.object({
 clienteId:z.string().optional().nullable(),
 formaPagamento:z.enum(["DINHEIRO","PIX","DEBITO","CREDITO","TRANSFERENCIA"]),
 desconto:z.number().finite().min(0).default(0),
 itens:z.array(z.object({produtoId:z.string().min(1),quantidade:z.number().finite().positive()})).min(1),
});
export async function GET(){
 const user=await sessaoApi();if(!user)return naoAutorizado();
 const vendas=await prisma.venda.findMany({where:{tenantId:user.tenantId},include:{itens:true,cliente:true},orderBy:{criadoEm:"desc"},take:100});
 return NextResponse.json(vendas);
}
export async function POST(req:Request){
 const user=await sessaoApi();if(!user)return naoAutorizado();
 const parsed=schema.safeParse(await req.json().catch(()=>null));
 if(!parsed.success)return NextResponse.json({erro:"Confira os itens e os dados da venda.",detalhes:parsed.error.flatten()},{status:400});
 try{return NextResponse.json(await registrarVenda(user.tenantId,parsed.data),{status:201});}
 catch(e){const msg=e instanceof Error?e.message:"";const errors:Record<string,string>={VENDA_SEM_ITENS:"Adicione ao menos um item.",QUANTIDADE_INVALIDA:"Quantidade inválida.",DESCONTO_INVALIDO:"Desconto inválido.",DESCONTO_MAIOR_SUBTOTAL:"Desconto maior que o subtotal.",PRODUTO_NAO_ENCONTRADO:"Produto indisponível.",CLIENTE_NAO_ENCONTRADO:"Cliente não encontrado.",ESTOQUE_INSUFICIENTE:"Estoque insuficiente para um dos produtos."};return NextResponse.json({erro:errors[msg]||"Não foi possível registrar a venda."},{status:400});}
}
