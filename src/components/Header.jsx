import React from 'react'
import AppBar from '@mui/material/AppBar'
import Toolbar from '@mui/material/Toolbar'
import Typography from '@mui/material/Typography'
import Button from '@mui/material/Button'
import Box from '@mui/material/Box'

export default function Header() {
  return (
    <AppBar position="static" color="primary" elevation={1}>
          <Toolbar disableGutters sx={{ display: 'flex', justifyContent: 'space-between', px: 4 }}>
            <Typography
              variant="h6"
              sx={{ fontWeight: 600, color: 'inherit', textDecoration: 'none' }}
            >
              VŠTJ Technika Jachting
            </Typography>

            <Box sx={{ display: 'flex', gap: 2 }}>
              <Button color="inherit" variant="text" sx={{ textTransform: 'none' }}>
                O nás
              </Button>
              <Button color="inherit" variant="text" sx={{ textTransform: 'none' }}>
                Kontakt
              </Button>
              <Button color="inherit" variant="text" sx={{ textTransform: 'none' }}>
                Galerie
              </Button>
              {/*<Button color="inherit" variant="text" sx={{ textTransform: 'none' }}>
                Novinky
              </Button>
              <Button color="inherit" variant="text" sx={{ textTransform: 'none' }}>
                Naše lodě
              </Button>
              <Button color="inherit" variant="text" sx={{ textTransform: 'none' }}>
                Přihláška do oddílu
              </Button>    
              <Button variant="contained" color="secondary" sx={{ textTransform: 'none' }}>
                Přihlásit
              </Button>*/}
            </Box>
          </Toolbar>
    </AppBar>
  )
}
