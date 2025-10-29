import { getSession } from "@/lib/auth";
import ButtonLink from "@/components/ui/ButtonLink";
import MembersTable from "@/features/members/components/MemberTable"
import { Paper, Typography, Stack } from "@mui/material";
import { prisma } from '@/lib/db'

export default async function AdminHome() {
  const session = await getSession();
  const email = session?.user?.email ?? "—";
  const role = session?.user?.role ?? "ADMIN";
  const members = await prisma.member.findMany({
    orderBy: { createdAt: 'desc' },
    select: { id: true, name: true, email: true, status: true, createdAt: true },
  })

  return (
    <main className="p-6">
      <Typography variant="h4" fontWeight={600} gutterBottom>
        Administrace
      </Typography>

      <Typography variant="body1" gutterBottom>
        Přihlášen jako: <strong>{email}</strong> ({String(role)})
      </Typography>

      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Sem přidáme admin nástroje a rychlé akce.
      </Typography>

      <Paper sx={{ p: 2 }}>
        <Typography variant="h6" sx={{ mb: 2 }}>
          Členové klubu
        </Typography>

        {/* Tabulka členů */}
        <Stack spacing={3}>
        <Stack direction="row" alignItems="center" justifyContent="space-between">
          <ButtonLink href="/members/new" variant="contained">Nový člen</ButtonLink>
        </Stack>

        <Paper sx={{ p: 2 }}>
          <MembersTable rows={members} />
        </Paper>
      </Stack>
      </Paper>
    </main>
  );
}
