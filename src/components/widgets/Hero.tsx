'use client'
import { Box, Container, Stack, Typography } from '@mui/material'

export default function Hero() {
  return (
    <Box sx={{
      bgcolor: 'primary.main',
      color: 'primary.contrastText',
      py: { xs: 6, md: 10 },
      backgroundImage: 'url(/hero.jpg)', // volitelně obrázek do /public
      backgroundSize: 'cover',
      backgroundPosition: 'center',
    }}>
      <Container>
        <Stack spacing={2} maxWidth={720}>
          <Typography variant="h3" fontWeight={800}>VŠTJ jachting ČVUT</Typography>
          <Typography variant="h6">Jachtingový oddíl ČVUT, pořádající kurzy pro studenty a věnující se jachtingu</Typography>
        </Stack>
      </Container>
    </Box>
  )
}