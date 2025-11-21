import React, { useState, useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom'
import { ThemeProvider } from '@mui/material/styles'
import CssBaseline from '@mui/material/CssBaseline'
import Box from '@mui/material/Box'
import Container from '@mui/material/Container'
import Header from './components/Header'
import Footer from './components/Footer'
import Typography from '@mui/material/Typography'
import Gallery from './components/Gallery'
import News from './components/News'
import Boats from './components/Boats'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import theme from './theme'
import './App.css'

// Main content component that handles routing
function AppContent() {
  const location = useLocation();
  const [onasContent, setOnasContent] = useState('');
  const [vedeniContent, setVedenicontent] = useState('');

  useEffect(() => {
    // Load markdown files only on home page
    if (location.pathname === '/') {
      fetch('/onas.md')
        .then(response => response.text())
        .then(text => setOnasContent(text))
        .catch(error => console.error('Error loading onas.md:', error));

      fetch('/vedeni.md')
        .then(response => response.text())
        .then(text => setVedenicontent(text))
        .catch(error => console.error('Error loading vedeni.md:', error));

      // Handle scroll to section after navigation
      if (location.state?.scrollTo) {
        setTimeout(() => {
          const element = document.getElementById(location.state.scrollTo);
          if (element) {
            element.scrollIntoView({ behavior: 'smooth' });
          }
        }, 100); // Small delay to ensure content is rendered
      }
    }
  }, [location.pathname, location.state]);

  const scrollToSection = (sectionId) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // Force light mode
  const lightTheme = {
    ...theme,
    palette: {
      ...theme.palette,
      mode: 'light',
    }
  };

  return (
    <ThemeProvider theme={lightTheme}>
      <CssBaseline />
      <Box display="flex" minHeight="100vh" flexDirection="column">
        <Header onNavClick={scrollToSection} />
        <Container component="main" sx={{ flex: 1, py: 4 }} maxWidth="lg">
          <Routes>
            <Route path="/" element={
              <>
                <Box id="onas" sx={{ '& h1, & h2, & h3, & h4, & h5, & h6': { color: 'primary.main', fontWeight: 500 }, '& p': { color: 'text.primary', fontWeight: 300 } }}>
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>{onasContent || 'Načítám obsah...'}</ReactMarkdown>
                </Box>
                <Box id="kontakt" sx={{ '& h1, & h2, & h3, & h4, & h5, & h6': { color: 'primary.main', fontWeight: 500 }, '& p': { color: 'text.primary', fontWeight: 300 } }}>
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>{vedeniContent || 'Načítám obsah...'}</ReactMarkdown>
                </Box>
                <Box id="galerie">
                  <Gallery />
                </Box>
              </>
            } />
            <Route path="/novinky" element={<News />} />
            <Route path="/novinky/:year?" element={<News />} />
            <Route path="/novinky/:year/:article" element={<News />} />
            <Route path="/nase-lode" element={<Boats />} />
          </Routes>
        </Container>
        <Footer />
      </Box>
    </ThemeProvider>
  );
}

function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}

export default App
