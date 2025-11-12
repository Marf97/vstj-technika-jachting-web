import React from 'react'
import { useTheme } from '@mui/material/styles'
import AppBar from '@mui/material/AppBar'
import Toolbar from '@mui/material/Toolbar'
import Typography from '@mui/material/Typography'
import Box from '@mui/material/Box'
import NavButton from './NavButton'

export default function Header() {
  const theme = useTheme()

  return (
    <AppBar
      position="static"
      sx={{
        backgroundImage: 'url(/src/assets/header-background.jpg)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        height: '250px',
        elevation: 0,
        position: 'relative',
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: theme.palette.navy.main + 'b3', // navy.main with 70% opacity
          zIndex: 1,
        }
      }}
    >
      <Toolbar
        disableGutters
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          height: '100%',
          position: 'relative',
          zIndex: 2,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <img
            src="/src/assets/logo/Logo_bile_zkracene.svg"
            alt="VŠTJ Logo"
            style={{ height: '100px', width: 'auto' }}
          />
          <Typography
            variant="h4"
            sx={{
              color: 'common.white',
              textDecoration: 'none',
            }}
          >
            VŠTJ Technika Jachting Praha
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', gap: 0 }}>
          <NavButton>O nás</NavButton>
          <NavButton>Kontakt</NavButton>
          <NavButton>Galerie</NavButton>
        </Box>
      </Toolbar>
    </AppBar>
  )
}
