import "./globals.css";
import { Providers } from "./providers";

export const metadata = {
  title: "Salgado Fácil",
  description: "Gestão simples de pedidos, vendas, produtos e financeiro.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR">
      <body><Providers>{children}</Providers></body>
    </html>
  );
}
