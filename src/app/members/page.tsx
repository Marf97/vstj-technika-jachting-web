import { prisma } from '@/lib/db'
import MembersTable from './ui'
import { Paper, Stack, Typography} from '@mui/material'
import ButtonLink from '@/components/ButtonLink'

export default async function MembersPage() {
  const members = await prisma.member.findMany({
    orderBy: { createdAt: 'desc' },
    select: { id: true, name: true, email: true, status: true, createdAt: true },
  })

  return (
    <Stack spacing={3}>
      <Stack direction="row" alignItems="center" justifyContent="space-between">
        <Typography variant="h5">Členové</Typography>
        <ButtonLink href="/members/new" variant="contained">Nový člen</ButtonLink>
      </Stack>

      <Paper sx={{ p: 2 }}>
        <MembersTable rows={members} />
      </Paper>
    </Stack>
  )
}
