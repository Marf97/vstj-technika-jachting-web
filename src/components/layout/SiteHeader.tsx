'use client'
import { Box, Container, Stack, Toolbar, Typography } from '@mui/material'
import NavLink from '@/components/ui/NavLink'
//import AuthButtons from '../ui/AuthButton'
import AuthButton from '../auth/AuthButton'

export default function SiteHeader() {
  return (
    <Box component="header" sx={{ bgcolor: 'background.default', color: 'text.primary', borderBottom: 1, borderColor: 'divider' }}>

      {/* hlavní lišta s menu */}
      <Box sx={{ bgcolor: 'primary.main', color: 'primary.contrastText' }}>
        <Toolbar disableGutters>
          <Container sx={{ display: 'flex', alignItems: 'center' }}>
            <Typography variant="h6" sx={{ flexGrow: 1, fontWeight: 700 }}>
              VŠTJ Technika - Jachting ČVUT
            </Typography>
            
            {/*<AuthButtons />*/}
            
            <Stack direction="row" spacing={1}>
              <NavLink href="/">O&nbsp;nás</NavLink>
              <NavLink href="/events">Události</NavLink>
              <NavLink href="/calendar">Kalendář</NavLink>
              <NavLink href="/members">Členové</NavLink>
              <NavLink href="/contact">Kontakt</NavLink>
              <AuthButton className="px-3 py-2 rounded border" />
            </Stack>
          </Container>
        </Toolbar>
      </Box>
    </Box>
  )
}
