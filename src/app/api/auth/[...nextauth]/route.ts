import NextAuth from "next-auth"
import { PrismaAdapter } from "@auth/prisma-adapter"
import Google from "next-auth/providers/google"
import Credentials from "next-auth/providers/credentials"
import { prisma } from "@/lib/db"
import bcrypt from "bcryptjs"

const handler = NextAuth({
  adapter: PrismaAdapter(prisma),
  session: { strategy: "database" },
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      // přidej vlastni scopes pro kalendář až budeš synchronizovat
      authorization: {
        params: {
          scope: "openid email profile https://www.googleapis.com/auth/calendar",
          access_type: "offline",        // důležité pro refresh_token
          prompt: "consent",             // vyžádá si offline přístup
        },
      },
    }),
//  AzureAD({
//    clientId: process.env.AZURE_AD_CLIENT_ID!,
//    clientSecret: process.env.AZURE_AD_CLIENT_SECRET!,
//    tenantId: process.env.AZURE_AD_TENANT_ID!,
//    authorization: {
//      params: {
//        scope: "openid email profile offline_access Calendars.ReadWrite",
//      },
//    },
//  }),

    // Volitelné: e-mail/heslo (Credentials)
    Credentials({
      name: "Email & Heslo",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Heslo", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null
        const user = await prisma.user.findUnique({ where: { email: credentials.email } })
        if (!user || !user.passwordHash) return null
        const ok = await bcrypt.compare(credentials.password, user.passwordHash)
        return ok ? user : null
      },
    }),
  ],
  callbacks: {
    async session({ session, user }) {
      // přidej si co chceš (role atd.)
      session.user.id = user.id
      return session
    },
  },
})

export { handler as GET, handler as POST }
