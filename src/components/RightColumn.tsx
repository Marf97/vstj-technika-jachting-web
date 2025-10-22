'use client'
import { Paper, Stack, Typography, Link as MLink, TextField, Button } from '@mui/material'

export function OpeningHoursCard() {
  return (
    <Paper sx={{ p: 2 }}>
      <Typography variant="h6" gutterBottom>Otevírací doba</Typography>
      <Stack spacing={0.5}>
        <Typography>Hala: PO–PÁ 7:00–20:00</Typography>
        <Typography>SO 10:00–17:00, NE 10:00–19:00</Typography>
        <Typography>Venku: 7:00–22:00 (sezóna)</Typography>
      </Stack>
    </Paper>
  )
}

export function QuickLinksCard() {
  return (
    <Paper sx={{ p: 2 }}>
      <Typography variant="h6" gutterBottom>Rychlé odkazy</Typography>
      <Stack>
        <MLink href="/events">Události</MLink>
        <MLink href="/calendar">Kalendář</MLink>
        <MLink href="/members">Členové</MLink>
        <MLink href="https://cvut.rezervujse.cz" target="_blank" rel="noreferrer">Rezervace kurtů</MLink>
      </Stack>
    </Paper>
  )
}

export function NewsletterCard() {
  return (
    <Paper sx={{ p: 2 }}>
      <Typography variant="h6" gutterBottom>Odběr novinek</Typography>
      <Stack direction="row" spacing={1} component="form" onSubmit={(e)=>e.preventDefault()}>
        <TextField size="small" type="email" placeholder="tvůj@email.cz" fullWidth />
        <Button variant="contained">Odeslat</Button>
      </Stack>
    </Paper>
  )
}