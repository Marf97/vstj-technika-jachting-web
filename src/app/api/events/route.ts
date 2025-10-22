import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

export async function GET() {
  const events = await prisma.event.findMany({ orderBy: { startsAt: 'asc' } })
  return NextResponse.json(events)
}
