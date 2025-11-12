import React, { useState, useEffect } from 'react'
import CssBaseline from '@mui/material/CssBaseline'
import Box from '@mui/material/Box'
import Container from '@mui/material/Container'
import Header from './components/Header'
import Footer from './components/Footer'
import Typography from '@mui/material/Typography'
import Gallery from './components/Gallery'
import ReactMarkdown from 'react-markdown'
import './App.css'

function App() {
  const [onasContent, setOnasContent] = useState('');
  const [vedeniContent, setVedenicontent] = useState('');

  useEffect(() => {
    // Load markdown files
    fetch('/src/assets/onas.md')
      .then(response => response.text())
      .then(text => setOnasContent(text))
      .catch(error => console.error('Error loading onas.md:', error));

    fetch('/src/assets/vedeni.md')
      .then(response => response.text())
      .then(text => setVedenicontent(text))
      .catch(error => console.error('Error loading vedeni.md:', error));
  }, []);

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
            <ReactMarkdown>{onasContent || 'Načítám obsah...'}</ReactMarkdown>
          </Box>
          <Box>
            <ReactMarkdown>{vedeniContent || 'Načítám obsah...'}</ReactMarkdown>
          </Box>
          <Box>
            <Gallery />
          </Box>
        </Container>
        <Footer />
      </Box>
    </>
  )
}

export default App
