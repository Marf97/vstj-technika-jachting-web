/*import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

// Bezpečnější detekce cesty (matchne /member i /member/xxx, case-insensitive)
const memberRegex = /^\/member(?:\/|$)/i;
const adminRegex = /^\/admin(?:\/|$)/i;

export async function middleware(req: NextRequest) {
  const { pathname, search } = req.nextUrl;

  // Pozor: AUTH_SECRET musí být vyplněné i pro edge (middleware)
  const token = await getToken({ req, secret: process.env.AUTH_SECRET });
  const isAuth = Boolean(token);

  const isAdminPath = adminRegex.test(pathname);
  const isMemberPath = memberRegex.test(pathname);

  // Nepřihlášený → redirect na /login s návratem
  if ((isAdminPath || isMemberPath) && !isAuth) {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("callbackUrl", pathname + search);
    return NextResponse.redirect(loginUrl);
  }

  // Přihlášený → role guard
  if (isAuth) {
    const role = (token?.role as string | null) ?? "GUEST";

    if (isAdminPath && role !== "ADMIN") {
      return NextResponse.redirect(new URL("/403", req.url));
    }
    if (isMemberPath && role !== "ADMIN" && role !== "MEMBER") {
      return NextResponse.redirect(new URL("/403", req.url));
    }
  }

  const res = NextResponse.next();
    res.headers.set("x-auth", String(Boolean(token)));
    res.headers.set("x-role", String(token?.role ?? "none"));
    res.headers.set("x-path", pathname);
    return res;
}

// DŮLEŽITÉ: matchni jak přesnou cestu, tak podcesty
export const config = {
  matcher: ["/admin", "/admin/:path*", "/member", "/member/:path*"],
};
*/

//----------------

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(req: NextRequest) {
  const url = req.nextUrl;

  // když URL nemá ?mw=1, přidej ji a přesměruj na stejnou stránku
  if (url.searchParams.get("mw") !== "1") {
    url.searchParams.set("mw", "1");
    return NextResponse.redirect(url);
  }

  // nastav i jednoduchý cookie (ne HttpOnly), ať jde vidět v prohlížeči
  const res = NextResponse.next();
  res.cookies.set("mw_test", "on", { path: "/", httpOnly: false });
  return res;
}

// Aplikuj všude, ať to nelze minout
export const config = {
  matcher: ["/:path*"],
};
