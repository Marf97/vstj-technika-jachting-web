import { PrismaClient } from '@prisma/client'
import ClientCalendar from './ui'

const prisma = new PrismaClient()

export default async function CalendarPage() {
  const events = await prisma.event.findMany({
    where: { isPublic: true },
    orderBy: { startsAt: 'asc' }
  })

  // map do FullCalendar formátu
  const fcEvents = events.map(e => ({
    id: e.id,
    title: e.title,
    start: e.startsAt.toISOString(),
    end: e.endsAt.toISOString(),
    url: `/api/ics/${e.id}`, // krátké kliknutí stáhne .ics
  }))

  return (
    <main className="p-6 max-w-5xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Kalendář akcí</h1>
      
      <ClientCalendar events={fcEvents} />
      <div className="mt-4">
        <a className="underline" href="/api/ics/feed">Veřejný iCal feed</a>
      </div>
    </main>
  )
}
