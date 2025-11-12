import React, { useState, useEffect } from 'react'
import { ThemeProvider } from '@mui/material/styles'
import CssBaseline from '@mui/material/CssBaseline'
import Box from '@mui/material/Box'
import Container from '@mui/material/Container'
import Header from './components/Header'
import Footer from './components/Footer'
import Typography from '@mui/material/Typography'
import Gallery from './components/Gallery'
import ReactMarkdown from 'react-markdown'
import theme from './theme'
import './App.css'

function App() {
  const [onasContent, setOnasContent] = useState('');
  const [vedeniContent, setVedenicontent] = useState('');

  // Force light mode
  const lightTheme = {
    ...theme,
    palette: {
      ...theme.palette,
      mode: 'light',
    }
  };

  useEffect(() => {
    // Load markdown files
    fetch('/onas.md')
      .then(response => response.text())
      .then(text => setOnasContent(text))
      .catch(error => console.error('Error loading onas.md:', error));

    fetch('/vedeni.md')
      .then(response => response.text())
      .then(text => setVedenicontent(text))
      .catch(error => console.error('Error loading vedeni.md:', error));
  }, []);

  const scrollToSection = (sectionId) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <ThemeProvider theme={lightTheme}>
      <CssBaseline />
      <Box display="flex" minHeight="100vh" flexDirection="column">
        <Header onNavClick={scrollToSection} />
        <Container component="main" sx={{ flex: 1, py: 4 }} maxWidth="lg">
          <Box id="onas" sx={{ '& h1, & h2, & h3, & h4, & h5, & h6': { color: 'primary.main', fontWeight: 500 }, '& p': { color: 'text.primary', fontWeight: 300 } }}>
            <ReactMarkdown>{onasContent || 'Načítám obsah...'}</ReactMarkdown>
          </Box>
          <Box id="kontakt" sx={{ '& h1, & h2, & h3, & h4, & h5, & h6': { color: 'primary.main', fontWeight: 500 }, '& p': { color: 'text.primary', fontWeight: 300 } }}>
            <ReactMarkdown>{vedeniContent || 'Načítám obsah...'}</ReactMarkdown>
          </Box>
          <Box id="galerie">
            <Gallery />
          </Box>
        </Container>
        <Footer />
      </Box>
    </ThemeProvider>
  )
}

export default App
