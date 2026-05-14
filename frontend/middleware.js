import { NextResponse } from "next/server";

const protectedPaths = [
  "/pedidos",
  "/favoritos",
  "/notificacoes",
  "/perfil",
  "/checkout",
  "/account",
  "/dashboard",
  "/seller",
];

const allowUnauthenticated = [
  "/seller/onboarding",
  "/login",
  "/signup",
  "/seller/onboarding/",
];

function isProtected(pathname) {
  if (allowUnauthenticated.some((p) => pathname === p || pathname.startsWith(p))) return false;

  return protectedPaths.some((p) => pathname === p || pathname.startsWith(p + "/"));
}

export function middleware(request) {
  const { nextUrl, cookies } = request;
  const pathname = nextUrl.pathname;

  if (pathname.startsWith("/api") || pathname.startsWith("/_next") || pathname.startsWith("/static") || pathname.includes(".")) {
    return NextResponse.next();
  }

  if (!isProtected(pathname)) return NextResponse.next();

  const hasAccess = Boolean(cookies.get("accessToken") || cookies.get("refreshToken"));

  if (hasAccess) return NextResponse.next();

  const returnTo = `${nextUrl.pathname}${nextUrl.search}`;
  const loginUrl = new URL(`/login?redirect=${encodeURIComponent(returnTo)}`, request.url);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: ["/:path*"],
};
