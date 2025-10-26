import { Role } from "@prisma/client";

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    role?: Role | null;
    emailVerified?: string | null;
  }
}
