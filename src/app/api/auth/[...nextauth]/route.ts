import NextAuth, { type NextAuthOptions } from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import Google from "next-auth/providers/google";
import Credentials from "next-auth/providers/credentials";
import { prisma } from "@/lib/db";
import { compare } from "bcrypt";
import { type Adapter } from "next-auth/adapters";

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma) as Adapter,
  session: { strategy: "jwt" },
  secret: process.env.AUTH_SECRET,
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
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Heslo", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null
        const user = await prisma.user.findUnique({ where: { email: credentials.email } })
        if (!user || !user.passwordHash) return null
        const ok = await compare(credentials.password, user.passwordHash)
        return ok ? user : null
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role ?? null;
        token.emailVerified = user.emailVerified
        ? user.emailVerified.toISOString()
        : null;
      } else if (!token.role && token.email) {
        const dbUser = await prisma.user.findUnique({
          where: { email: token.email as string },
          select: { id: true, role: true, emailVerified: true },
        });
        if (dbUser) {
          token.id = dbUser.id;
          token.role = dbUser.role;
          token.emailVerified = dbUser.emailVerified
          ? dbUser.emailVerified.toISOString()
          : null;
        }
      }
      return token;
    },

    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role ?? null;
        session.user.emailVerified = token.emailVerified
        ? new Date(token.emailVerified)
        : null;
      }
      return session;
    },
  }
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
