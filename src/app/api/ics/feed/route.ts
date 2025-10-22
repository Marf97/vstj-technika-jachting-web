import { PrismaClient } from '@prisma/client'
import ical from 'ical-generator'
import { NextResponse } from 'next/server'

const prisma = new PrismaClient()

export async function GET() {
  const now = new Date()
  const events = await prisma.event.findMany({
    where: { startsAt: { gte: now }, isPublic: true },
    orderBy: { startsAt: 'asc' }
  })

  const cal = ical({ name: 'Klub – Veřejný kalendář', timezone: 'Europe/Prague' })
  for (const e of events) {
    cal.createEvent({
      id: e.id,
      start: new Date(e.startsAt),
      end: new Date(e.endsAt),
      summary: e.title,
      description: e.description ?? '',
      location: e.location ?? '',
      url: `${process.env.PUBLIC_BASE_URL ?? 'http://localhost:3000'}/events/${e.id}`,
    })
  }

  return new NextResponse(cal.toString(), {
    headers: { 'Content-Type': 'text/calendar; charset=utf-8' }
  })
}
