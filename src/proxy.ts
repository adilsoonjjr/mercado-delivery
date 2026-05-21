import NextAuth from "next-auth";
import { authConfig } from "@/lib/auth.config";
import { NextResponse } from "next/server";

// Use edge-safe config (no prisma) for the middleware
const { auth } = NextAuth(authConfig);

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const session = req.auth;

  if (pathname.startsWith("/admin")) {
    if (!session) {
      return NextResponse.redirect(new URL("/login", req.url));
    }
    if (session.user.role !== "ADMIN") {
      return NextResponse.redirect(new URL("/", req.url));
    }
  }

  if (pathname.startsWith("/checkout") || pathname.startsWith("/meus-pedidos")) {
    if (!session) {
      return NextResponse.redirect(new URL("/login?redirect=" + pathname, req.url));
    }
  }

  // Resolve market slug from subdomain and pass via header
  const hostname = req.headers.get("host") ?? "";
  const envSlug = process.env.MARKET_SLUG;
  let slug: string;
  if (envSlug) {
    slug = envSlug;
  } else {
    const parts = hostname.split(".");
    slug = parts.length >= 3 ? parts[0] : "default";
  }

  const res = NextResponse.next();
  res.headers.set("x-market-slug", slug);
  return res;
});

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon\\.ico).*)"],
};
