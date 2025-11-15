import React from 'react'
import { useTheme } from '@mui/material/styles'
import AppBar from '@mui/material/AppBar'
import Toolbar from '@mui/material/Toolbar'
import Typography from '@mui/material/Typography'
import Box from '@mui/material/Box'
import NavButton from './NavButton'

export default function Header({ onNavClick }) {
  const theme = useTheme()

  const handleNavClick = (section) => {
    const sectionId = section.toLowerCase().replace(/\s+/g, '');
    if (onNavClick) {
      onNavClick(sectionId);
    }
  };

  return (
    <AppBar
      position="static"
      sx={{
        backgroundImage: 'url(/header-background.JPG)',
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
        <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 1, sm: 2 } }}>
          <img
            src="/logo/Logo_bile_zkracene.svg"
            alt="VŠTJ Logo"
            style={{
              height: 'auto',
              width: 'auto',
              maxHeight: '100px',
              maxWidth: '200px'
            }}
            sx={{
              height: { xs: '60px', sm: '80px', md: '100px' }
            }}
          />
          <Typography
            variant="h4"
            sx={{
              color: 'common.white',
              textDecoration: 'none',
              fontSize: { xs: '1.2rem', sm: '1.5rem', md: '2rem' },
            }}
          >
            VŠTJ Technika Jachting Praha
          </Typography>
        </Box>

        <Box sx={{
          display: 'flex',
          flexDirection: { xs: 'column', sm: 'row' },
          gap: { xs: 0.5, sm: 0 },
          alignItems: { xs: 'flex-end', sm: 'center' }
        }}>
          <NavButton onClick={() => window.location.href = '/'}>O nás</NavButton>
          <NavButton onClick={() => handleNavClick('Kontakt')}>Kontakt</NavButton>
          <NavButton onClick={() => handleNavClick('Galerie')}>Galerie</NavButton>
          <NavButton onClick={() => window.location.href = '/novinky'}>Novinky</NavButton>
        </Box>
      </Toolbar>
    </AppBar>
  )
}
