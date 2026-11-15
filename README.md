# Salgado Fácil

Sistema de gestão de pedidos, vendas, produtos, estoque e financeiro para negócio de salgados.

## Tecnologias
- Next.js 14 e React 18
- TypeScript
- PostgreSQL e Prisma
- NextAuth
- Tailwind CSS
- TanStack Query e Recharts

## Requisitos
- Node.js 20 ou superior
- PostgreSQL

## Configuração local
1. Execute `npm install`.
2. Copie `.env.example` para `.env` e configure PostgreSQL e um segredo forte para NextAuth.
3. Execute `npx prisma generate`.
4. Execute `npx prisma migrate dev --name init`.
5. Execute `npm run dev` e abra http://localhost:3000.

## Segurança
- Nunca envie o arquivo `.env` ao GitHub.
- Cadastre as variáveis reais no ambiente de hospedagem.
- A aplicação está sendo estruturada para separar dados por empresa (tenant).
- Autenticação, permissões, validações e testes serão concluídos antes do uso real.

## Situação
Estrutura inicial em desenvolvimento. Os módulos e integrações serão implementados e testados antes da publicação.
