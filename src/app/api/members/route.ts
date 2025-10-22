import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

export async function GET() {
  const members = await prisma.member.findMany({ orderBy: { createdAt: 'desc' } })
  return NextResponse.json(members)
}
