import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { compare } from "bcryptjs";
import { prisma } from "@/lib/prisma";

export const authOptions: NextAuthOptions = {
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  providers: [
    CredentialsProvider({
      name: "Acesso",
      credentials: {
        email: { label: "E-mail", type: "email" },
        senha: { label: "Senha", type: "password" },
      },
      async authorize(credentials) {
        const email = credentials?.email?.trim().toLowerCase();
        const senha = credentials?.senha;
        if (!email || !senha) return null;

        const usuario = await prisma.usuario.findFirst({
          where: { email, ativo: true, tenant: { ativo: true } },
          include: { tenant: true },
        });
        if (!usuario || !(await compare(senha, usuario.senhaHash))) return null;

        return {
          id: usuario.id,
          name: usuario.nome,
          email: usuario.email,
          tenantId: usuario.tenantId,
          papel: usuario.papel,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.sub = user.id;
        token.tenantId = (user as typeof user & { tenantId: string }).tenantId;
        token.papel = (user as typeof user & { papel: string }).papel;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub ?? "";
        session.user.tenantId = typeof token.tenantId === "string" ? token.tenantId : "";
        session.user.papel = typeof token.papel === "string" ? token.papel : "OPERADOR";
      }
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
};
