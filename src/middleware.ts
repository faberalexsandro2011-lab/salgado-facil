import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const papel = req.nextauth.token?.papel;
    const caminho = req.nextUrl.pathname;

    if ((caminho.startsWith("/financeiro") || caminho.startsWith("/usuarios")) && papel !== "ADMIN") {
      return NextResponse.redirect(new URL("/", req.url));
    }
    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token, req }) => req.nextUrl.pathname === "/login" || !!token,
    },
    pages: { signIn: "/login" },
  }
);

export const config = {
  matcher: ["/((?!api/auth|_next/static|_next/image|favicon.ico).*)"],
};
