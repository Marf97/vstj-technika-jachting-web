import NextAuth, { DefaultSession } from "next-auth"

declare module "next-auth" {
  interface Session {
    user: {
      id: string
      name?: string | null
      email?: string | null
      image?: string | null
      // sem si můžeš přidat role apod.
    } & DefaultSession["user"]
  }

  interface User {
    id: string
    name?: string | null
    email?: string | null
    image?: string | null
    // pokud používáš credentials:
    passwordHash?: string | null
  }
}
