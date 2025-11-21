import React, { useState, useEffect } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import Dialog from '@mui/material/Dialog';
import IconButton from '@mui/material/IconButton';
import CloseIcon from '@mui/icons-material/Close';

export default function Boats() {
  const [chilliContent, setChilliContent] = useState('');
  const [cubaContent, setCubaContent] = useState('');
  const [selectedImage, setSelectedImage] = useState(null);
  const [imageLoading, setImageLoading] = useState(false);

  useEffect(() => {
    fetch('/boats-chilli.md')
      .then(response => response.text())
      .then(text => setChilliContent(text))
      .catch(error => console.error('Error loading boats-chilli.md:', error));

    fetch('/boats-cuba.md')
      .then(response => response.text())
      .then(text => setCubaContent(text))
      .catch(error => console.error('Error loading boats-cuba.md:', error));
  }, []);

  const handleImageClick = (src, alt) => {
    setSelectedImage({ src, alt });
    setImageLoading(true);
    // Preload the full image
    const img = new Image();
    img.onload = () => setImageLoading(false);
    img.src = src;
  };

  const handleCloseDialog = () => {
    setSelectedImage(null);
    setImageLoading(false);
  };

  const customComponents = {
    table: ({ children, ...props }) => (
      <Box sx={{ display: 'flex', justifyContent: 'center', my: 2 }}>
        <table {...props} style={{ maxWidth: '600px', width: '100%', borderCollapse: 'collapse' }}>
          {children}
        </table>
      </Box>
    ),
    h1: ({ children, ...props }) => (
      <Typography variant="h1" sx={{ textAlign: 'center', color: 'primary.main', fontWeight: 500, mb: 2 }} {...props}>
        {children}
      </Typography>
    ),
    h2: ({ children, ...props }) => (
      <Typography variant="h2" sx={{ textAlign: 'center', color: 'primary.main', fontWeight: 500, mb: 2, fontSize: '2.5rem' }} {...props}>
        {children}
      </Typography>
    ),
    img: ({ src, alt, ...props }) => (
      <Box sx={{ display: 'flex', justifyContent: 'center', my: 2 }}>
        <Box
          component="img"
          src={src}
          alt={alt}
          sx={{
            width: '250px',
            height: '200px',
            objectFit: 'contain',
            cursor: 'pointer',
            borderRadius: 1,
            boxShadow: 2,
            backgroundColor: 'grey.100',
            '&:hover': { opacity: 0.8 }
          }}
          onClick={() => handleImageClick(src, alt)}
          {...props}
        />
      </Box>
    ),
  };

  return (
    <>
      <Typography variant="h2" color="primary.main" sx={{ mb: 4, textAlign: 'center', fontWeight: 500, px: { xs: 2, sm: 3, md: 4 } }}>
        Naše lodě
      </Typography>

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: {
            xs: '1fr', // single column on mobile
            md: '1fr 1fr' // two columns on medium screens and up
          },
          gap: 4,
          px: { xs: 2, sm: 3, md: 4 }, // Add horizontal padding
          '& h1, & h2, & h3, & h4, & h5, & h6': {
            color: 'primary.main',
            fontWeight: 500,
            wordBreak: 'break-word',
            overflowWrap: 'break-word'
          },
          '& p': {
            color: 'text.primary',
            fontWeight: 300,
            wordBreak: 'break-word',
            overflowWrap: 'break-word'
          },
          '& ul, & ol': {
            wordBreak: 'break-word',
            overflowWrap: 'break-word'
          },
          '& li': {
            wordBreak: 'break-word',
            overflowWrap: 'break-word'
          }
        }}
      >
        {/* Chilli Section */}
        <Box>
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={customComponents}
          >
            {chilliContent || 'Načítám obsah...'}
          </ReactMarkdown>
        </Box>

        {/* Cuba Libre Section */}
        <Box>
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={customComponents}
          >
            {cubaContent || 'Načítám obsah...'}
          </ReactMarkdown>
        </Box>
      </Box>

      <Dialog
        open={!!selectedImage}
        onClose={handleCloseDialog}
        fullScreen
        sx={{
          '& .MuiDialog-paper': {
            backgroundColor: 'black',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }
        }}
      >
        <IconButton
          onClick={handleCloseDialog}
          sx={{
            position: 'absolute',
            right: 16,
            top: 16,
            bgcolor: '#1F2646',
            color: 'white',
            '&:hover': { bgcolor: '#6396C1' },
            zIndex: 1
          }}
        >
          <CloseIcon />
        </IconButton>
        {selectedImage && (
          <>
            {imageLoading && (
              <Typography sx={{ color: 'white' }}>Načítám obrázek…</Typography>
            )}
            <Box
              component="img"
              src={selectedImage.src}
              alt={selectedImage.alt}
              sx={{
                maxWidth: '100%',
                maxHeight: '100%',
                objectFit: 'contain',
                display: imageLoading ? 'none' : 'block'
              }}
            />
          </>
        )}
      </Dialog>
    </>
  );
}