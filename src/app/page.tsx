import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

export default async function Home() {
  const [members, events] = await Promise.all([
    prisma.member.findMany({ orderBy: { createdAt: 'desc' } }),
    prisma.event.findMany({ orderBy: { startsAt: 'asc' } }),
  ])

  return (
    <main className="p-6 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Klub – přehled</h1>

      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-2">Členové</h2>
        <ul className="list-disc pl-5">
          {members.map(m => (
            <li key={m.id}>{m.name} ({m.email})</li>
          ))}
        </ul>
      </section>

      <section>
        <h2 className="text-xl font-semibold mb-2">Akce</h2>
        <ul className="list-disc pl-5">
          {events.map(e => (
            <li key={e.id}>
              {e.title} — {new Date(e.startsAt).toLocaleString('cs-CZ')}
              {' '}<a className="underline" href={`/api/ics/${e.id}`}>Přidat do kalendáře (.ics)</a>
            </li>
          ))}
        </ul>
      </section>
    </main>
  )
}
