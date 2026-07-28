import { NextRequest, NextResponse } from "next/server";
import { verifySessionToken, SESSION_COOKIE_NAME } from "@/lib/auth";
import { locales, defaultLocale } from "@/lib/i18n/dictionaries";

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // --- Admin: se queda en español, sin prefijo de idioma, protegido por login ---
  if (pathname.startsWith("/admin")) {
    if (pathname === "/admin/login") return NextResponse.next();

    const token = req.cookies.get(SESSION_COOKIE_NAME)?.value;
    const valid = token ? await verifySessionToken(token) : false;

    if (!valid) {
      return NextResponse.redirect(new URL("/admin/login", req.url));
    }
    return NextResponse.next();
  }

  // --- Sitio público: fuerza prefijo /es o /en ---
  const hasLocale = locales.some(
    (l) => pathname === `/${l}` || pathname.startsWith(`/${l}/`)
  );
  if (hasLocale) return NextResponse.next();

  const url = req.nextUrl.clone();
  url.pathname = `/${defaultLocale}${pathname}`;
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ["/((?!_next|api|.*\\..*).*)"],
};
