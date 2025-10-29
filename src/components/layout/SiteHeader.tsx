'use client'
import { Box, Container, Stack, Toolbar, Typography } from '@mui/material'
import NavLink from '@/components/ui/NavLink'
import AuthButton from '../auth/AuthButton'

type Role = 'GUEST' | 'MEMBER' | 'ADMIN';

export default function SiteHeader({ role }: { role: Role }) {

  const isMember = role === 'MEMBER' || role === 'ADMIN';
  const isAdmin  = role === 'ADMIN';
  
  return (
    <Box component="header" sx={{ bgcolor: 'background.default', color: 'text.primary', borderBottom: 1, borderColor: 'divider' }}>
      <Box sx={{ bgcolor: 'primary.main', color: 'primary.contrastText' }}>
        <Toolbar disableGutters>
          <Container sx={{ display: 'flex', alignItems: 'center' }}>
            <Typography variant="h6" sx={{ flexGrow: 1, fontWeight: 700 }}>
              VŠTJ Technika - Jachting ČVUT
            </Typography>

            <Stack direction="row" spacing={1} alignItems="center">
              {/* GUEST: jen O nás + Kontakt */}
              <NavLink href="/">O&nbsp;nás</NavLink>

              {/* MEMBER+ADMIN: navíc Události + Kalendář */}
              {isMember && <NavLink href="/events">Události</NavLink>}
              {isMember && <NavLink href="/calendar">Kalendář</NavLink>}

              <NavLink href="/contact">Kontakt</NavLink>

              {/* ADMIN: navíc Správa */}
              {isAdmin && <NavLink href="/admin">Správa</NavLink>}

              {/* Přihlásit/Odhlásit – řeší interně AuthButton */}
              <AuthButton className="px-3 py-2 rounded border" />
            </Stack>
          </Container>
        </Toolbar>
      </Box>
    </Box>
  )
}
