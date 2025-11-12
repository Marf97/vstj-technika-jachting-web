import React from 'react'
import CssBaseline from '@mui/material/CssBaseline'
import Box from '@mui/material/Box'
import Container from '@mui/material/Container'
import Header from './components/Header'
import Footer from './components/Footer'
import Typography from '@mui/material/Typography'
import Gallery from './components/Gallery'
import './App.css'

function App() {
  return (
    <>
      <CssBaseline />
      <Box display="flex" minHeight="100vh" flexDirection="column">
        <Header />
        <Container component="main" sx={{ flex: 1, py: 4 }} maxWidth="lg">
          {/* Hero section using image from public/hero.jpg */}
          <Box
            sx={{
              height: 360,
              borderRadius: 10,
              backgroundImage: 'url(/hero.jpg)',
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'common.white',
              mb: 4,
            }}
          >
            <Box sx={{ bgcolor: 'rgba(0,0,0,0.4)', p: 3, borderRadius: 1 }}>
              <h1 style={{ margin: 0 }}>VŠTJ Technika Jachting</h1>
            </Box>
          </Box>
          <Box>
            <Typography variant="h4" gutterBottom>
              O Nás
            </Typography>
            <p>
              Tady bude něco o náš 😊
            </p>
            <Typography variant="h5" gutterBottom>
              VŠTJ
            </Typography>
            <p>
              Jsme součástí Vysokoškolské tělovýchovné jednoty (VŠTJ) Technika. Ale co to vlastně je? 🤔
            </p>
            <Typography variant="h5" gutterBottom>
              Jachting
            </Typography>
            <p>
              Fouká vítr, držte si kloubouky! ⛵💨
            </p>
          </Box>
          <Box>
            <Typography variant="h4" gutterBottom>
              Kontakt
            </Typography>
            <p>
              Brzy tady přidáme kontaktní informace. Zatím můžeš poslat holuba🕊️
            </p>
          </Box>
          <Box>
            <Typography variant="h4" gutterBottom>
              Galerie
            </Typography>
            <Gallery />
          </Box>
        </Container>
        <Footer />
      </Box>
    </>
  )
}

export default App
