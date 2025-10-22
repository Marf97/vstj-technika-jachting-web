'use client'
import { Box, Container, Stack, Typography } from '@mui/material'

export default function SiteHeader() {
  return (
    <Box component="header" sx={{ bgcolor: 'background.default', color: 'text.primary', borderBottom: 1, borderColor: 'divider' }}>

      {/* hlavní lišta s menu */}
      <Box component="footer" sx={{ mt: 6, py: 4, bgcolor: 'background.paper', borderTop: 1, borderColor: 'divider' }}>
        <Container sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 3, justifyContent: 'space-between' }}>
          <Stack>
            <Typography variant="subtitle1">Kontakt</Typography>
            <Typography variant="body2">Zatím u Martin na lokálu</Typography>
            <Typography variant="body2">Telefonní číslo snad někdy</Typography>
            <Typography variant="body2">klubový email</Typography>
          </Stack>
          <Stack>
            <Typography variant="subtitle1">Můžeme sem napsat cokoli...</Typography>
            <Typography variant="body2">Třeba že máme rádi Daníka</Typography>
            <Typography variant="body2">(kecám)</Typography>
          </Stack>
        </Container>
      </Box>
    </Box>
  )
}
