import { getSession } from "@/lib/auth";

export default async function MemberHome() {
  const session = await getSession();
  const email = session?.user?.email ?? "—";
  const role = session?.user?.role ?? "MEMBER";

  return (
    <main className="p-6">
      <h1 className="text-2xl font-semibold mb-4">Členská zóna</h1>
      <p>Přihlášen jako: <strong>{email}</strong> ({String(role)})</p>
      <p className="mt-2">Sem později přidáme odkazy a obsah pro členy.</p>
      <pre style={{fontSize:12, opacity:0.6}}>
        {JSON.stringify(session, null, 2)}
      </pre>
    </main>
  );
}
