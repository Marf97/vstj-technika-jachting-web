'use client'
import { Box, Container, Stack, Toolbar, Typography } from '@mui/material'
import ButtonLink from '@/components/ButtonLink'

export default function SiteHeader() {
  return (
    <Box component="header" sx={{ bgcolor: 'background.default', color: 'text.primary', borderBottom: 1, borderColor: 'divider' }}>

      {/* hlavní lišta s menu */}
      <Box sx={{ bgcolor: 'primary.main', color: 'primary.contrastText' }}>
        <Toolbar disableGutters>
          <Container sx={{ display: 'flex', alignItems: 'center' }}>
            <Typography variant="h6" sx={{ flexGrow: 1, fontWeight: 700 }}>
              VŠTJ Technika – Klub
            </Typography>
            <Stack direction="row" spacing={1}>
              <ButtonLink href="/" color="inherit">O&nbsp;nás</ButtonLink>
              <ButtonLink href="/events" color="inherit">Události</ButtonLink>
              <ButtonLink href="/calendar" color="inherit">Kalendář</ButtonLink>
              <ButtonLink href="/members" color="inherit">Členové</ButtonLink>
              <ButtonLink href="/contact" color="inherit">Kontakt</ButtonLink>
            </Stack>
          </Container>
        </Toolbar>
      </Box>
    </Box>
  )
}
