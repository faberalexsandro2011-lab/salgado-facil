import {NextResponse} from "next/server";
import {z} from "zod";
import {prisma} from "@/lib/prisma";
import {naoAutorizado,proibido,sessaoApi} from "@/lib/api-auth";
const schema=z.object({descricao:z.string().trim().min(2).max(160,c=>"Descrição inválida"),categoria:z.string().trim().max(60).optional().nullable(),valor:z.number().finite().positive().max(9999999),data:z.string().datetime().optional(),observacao:z.string().max(500).optional().nullable()});
export async function GET(){const u=await sessaoApi();if(!u)return naoAutorizado();const d=await prisma.despesa.findMany({where:{tenantId:u.tenantId},orderBy:{data:"desc"},take:300});return NextResponse.json(d);}
export async function POST(req:Request){const u=await sessaoApi();if(!u)return naoAutorizado();if(u.papel!=="ADMIN")return proibido();const p=schema.safeParse(await req.json().catch(()=>null));if(!p.success)return NextResponse.json({erro:"Confira os dados da despesa.",detalhes:p.error.flatten()},{status:400});const d=await prisma.despesa.create({data:{tenantId:u.tenantId,descricao:p.data.descricao,categoria:p.data.categoria||null,valor:p.data.valor,data:p.data.data?new Date(p.data.data):new Date(),observacao:p.data.observacao||null}});return NextResponse.json(d,{status:201});}
