import { prisma } from '@/lib/db'
import EventsTable from '../../../features/events/components/EventsTable'
import { Paper, Stack, Typography } from '@mui/material'
import ButtonLink from '@/components/ui/ButtonLink'

export default async function EventsPage() {
  const events = await prisma.event.findMany({
    orderBy: { startsAt: 'asc' },
    select: {
      id: true, title: true, startsAt: true, endsAt: true,
      location: true, isPublic: true,
    },
  })

  return (
    <Stack spacing={3}>
      <Stack direction="row" alignItems="center" justifyContent="space-between">
        <Typography variant="h5">Události</Typography>
        <Stack direction="row" spacing={1}>
          <ButtonLink href="/calendar" variant="outlined">Kalendář</ButtonLink>
          <ButtonLink href="/api/ics/feed" variant="outlined">Veřejný iCal feed</ButtonLink>
          {/* případně tlačítko "Nová událost" až doplníme formulář */}
        </Stack>
      </Stack>

      <Paper sx={{ p: 2 }}>
        <EventsTable rows={events} />
      </Paper>
    </Stack>
  )
}
