import { getSession } from "@/lib/auth";

export default async function AdminHome() {
  const session = await getSession();
  const email = session?.user?.email ?? "—";
  const role = session?.user?.role ?? "ADMIN";

  return (
    <main className="p-6">
      <h1 className="text-2xl font-semibold mb-4">Administrace</h1>
      <p>Přihlášen jako: <strong>{email}</strong> ({String(role)})</p>
      <p className="mt-2">Sem přidáme admin nástroje a rychlé akce.</p>
    </main>
  );
}
