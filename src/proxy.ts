import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

const memberRegex = /^\/member(?:\/|$)/i;
const adminRegex = /^\/admin(?:\/|$)/i;

export default withAuth(
  function middleware(req) {
    const { pathname } = req.nextUrl;
    const token = req.nextauth.token;

    const role = (token?.role as string | null) ?? "GUEST";

    const isAdminPath = adminRegex.test(pathname);
    const isMemberPath = memberRegex.test(pathname);

    if (isAdminPath && role !== "ADMIN") {
      return NextResponse.redirect(new URL("/403", req.url));
    }
    if (isMemberPath && role !== "ADMIN" && role !== "MEMBER") {
      return NextResponse.redirect(new URL("/403", req.url));
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const { pathname } = req.nextUrl;

        const needsAuth =
          adminRegex.test(pathname) || memberRegex.test(pathname);

        if (!needsAuth) return true;

        return !!token;
      },
    },
    pages: {
      signIn: "/login",
    },
  }
);

export const config = {
  matcher: ["/admin", "/admin/:path*", "/member", "/member/:path*"],
};
