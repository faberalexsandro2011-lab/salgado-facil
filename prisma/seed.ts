import { PrismaClient, Papel } from "@prisma/client";
import { hash } from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const senha = process.env.ADMIN_PASSWORD;
  const nomeEmpresa = process.env.TENANT_NAME || "Minha empresa";
  const nomeAdmin = process.env.ADMIN_NAME || "Administrador";

  if (!email || !senha || senha.length < 12) {
    throw new Error("Defina ADMIN_EMAIL e ADMIN_PASSWORD (mínimo 12 caracteres) no .env antes de executar o seed.");
  }

  const slug = (process.env.TENANT_SLUG || "minha-empresa")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

  const tenant = await prisma.tenant.upsert({
    where: { slug },
    update: { nome: nomeEmpresa },
    create: { slug, nome: nomeEmpresa },
  });

  const senhaHash = await hash(senha, 12);
  await prisma.usuario.upsert({
    where: { tenantId_email: { tenantId: tenant.id, email } },
    update: { nome: nomeAdmin, senhaHash, papel: Papel.ADMIN, ativo: true },
    create: { tenantId: tenant.id, nome: nomeAdmin, email, senhaHash, papel: Papel.ADMIN },
  });
  console.log("Empresa e usuário administrador inicializados.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => prisma.$disconnect());
