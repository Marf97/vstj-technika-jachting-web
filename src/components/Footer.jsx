import React from 'react'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Container from '@mui/material/Container'

export default function Footer() {
  return (
    <Box component="footer" sx={{ bgcolor: 'grey.200', py: 2 }}>
      <Container maxWidth="lg">
        <Typography variant="body2" color="text.secondary" align="center">
          © {new Date().getFullYear()} VŠTJ Technika Jachting
        </Typography>
      </Container>
    </Box>
  )
}
