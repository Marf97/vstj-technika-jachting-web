"use client";
import { signOut, useSession } from "next-auth/react";
import Link from "next/link";

type Props = {
  className?: string; // pro snadný styling v headeru
};

export default function AuthButton({ className }: Props) {
  const { data: session, status } = useSession();
  const loading = status === "loading";

  if (loading) {
    return <span className={className}>…</span>;
  }

  if (!session) {
    return (
      <Link href="/login" className={className}>
        Přihlásit
      </Link>
    );
  }

  return (
    <button
      className={className}
      onClick={() => signOut({ callbackUrl: "/" })}
      type="button"
    >
      Odhlásit
    </button>
  );
}
