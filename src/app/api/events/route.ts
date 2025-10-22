import { NextResponse } from 'next/server'
import { prisma } from '../../../lib/db'

export async function GET() {
  const events = await prisma.event.findMany({ orderBy: { startsAt: 'asc' } })
  return NextResponse.json(events)
}
