export { default } from "next-auth/middleware"

export const config = {
  matcher: [
    "/admin/:path*", // cokoliv pod /admin bude vyžadovat přihlášení
  ],
}
