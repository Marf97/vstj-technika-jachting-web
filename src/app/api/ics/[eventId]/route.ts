import ical from 'ical-generator'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '../../../../lib/db'


export async function GET(
  _req: NextRequest,
  ctx: { params : Promise<{ eventId: string }> }
) {
  const { eventId } = await ctx.params
  const event = await prisma.event.findUnique({ where: { id: eventId } })
  if (!event) return new NextResponse('Not found', { status: 404 })

  const cal = ical({ name: 'Klub – Jednotlivá akce' })
  cal.createEvent({
    id: event.id,
    start: new Date(event.startsAt),
    end: new Date(event.endsAt),
    summary: event.title,
    description: event.description ?? '',
    location: event.location ?? '',
    url: `${process.env.PUBLIC_BASE_URL ?? 'http://localhost:3000'}/events/${event.id}`,
    timezone: 'Europe/Prague',
  })

  const body = cal.toString()
  return new NextResponse(body, {
    headers: {
      'Content-Type': 'text/calendar; charset=utf-8',
      'Content-Disposition': `attachment; filename="${event.id}.ics"`,
      'Cache-Control': 'no-store',
    },
  })
}
