import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { Role } from "@prisma/client";

export async function getSession() {
  return getServerSession(authOptions);
}

export async function getCurrentUser() {
  const session = await getSession();
  return session?.user ?? null;
}

export function hasRole(
  user: { role?: Role | string | null } | null | undefined,
  required: Role
) {
  if (!user?.role) return false;
  // ADMIN implicitně pokrývá MEMBER/GUEST
  if (user.role === "ADMIN") return true;
  if (required === "MEMBER" && user.role === "MEMBER") return true;
  if (required === "GUEST") return true;
  return false;
}
