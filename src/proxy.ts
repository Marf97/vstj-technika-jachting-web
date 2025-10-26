import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

// regexy na pohodlné rozpoznání cest
const memberRegex = /^\/member(?:\/|$)/i;
const adminRegex = /^\/admin(?:\/|$)/i;

export default withAuth(
  // TATO funkce se spustí POUZE, když callbacks.authorized vrátí true
  // (tj. uživatel je přihlášený). Tady doladíme role → případně přesměrujeme na /403.
  function middleware(req) {
    const { pathname } = req.nextUrl;
    const token = req.nextauth.token; // díky withAuth je token k dispozici

    const role = (token?.role as string | null) ?? "GUEST";

    const isAdminPath = adminRegex.test(pathname);
    const isMemberPath = memberRegex.test(pathname);

    if (isAdminPath && role !== "ADMIN") {
      return NextResponse.redirect(new URL("/403", req.url));
    }
    if (isMemberPath && role !== "ADMIN" && role !== "MEMBER") {
      return NextResponse.redirect(new URL("/403", req.url));
    }

    // jinak propusť dál
    return NextResponse.next();
  },
  {
    // authorized = false  ⇒ withAuth pošle uživatele na signIn (viz pages.signIn)
    callbacks: {
      authorized: ({ token, req }) => {
        const { pathname } = req.nextUrl;

        // Cesty, které chceme chránit:
        const needsAuth =
          adminRegex.test(pathname) || memberRegex.test(pathname);

        if (!needsAuth) return true; // mimo chráněné cesty neřešíme

        // Na chráněných cestách požadujeme aspoň přihlášení
        return !!token;
      },
    },
    pages: {
      // kam poslat nepřihlášené
      signIn: "/login",
    },
  }
);

// Matchuj /admin i /member (včetně podcest)
export const config = {
  matcher: ["/admin", "/admin/:path*", "/member", "/member/:path*"],
};
