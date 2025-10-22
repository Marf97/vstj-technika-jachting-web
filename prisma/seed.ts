import { prisma } from '../src/lib/db'

async function main() {
  const alice = await prisma.member.upsert({
    where: { email: 'alice@example.com' },
    update: {},
    create: { email: 'alice@example.com', name: 'Alice Example' },
  })

  const now = new Date()
  const in3days = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000)
  const in3daysPlus2h = new Date(in3days.getTime() + 2 * 60 * 60 * 1000)

  const event = await prisma.event.create({
    data: {
      title: 'Úvodní schůze klubu',
      description: 'Seznámení a plán akcí.',
      startsAt: in3days,
      endsAt: in3daysPlus2h,
      location: 'Klubovna',
      isPublic: true,
    },
  })

  await prisma.eventRegistration.create({
    data: { memberId: alice.id, eventId: event.id }
  })

  console.log('Seed done.')
}

main().finally(() => prisma.$disconnect())
