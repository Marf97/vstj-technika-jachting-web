import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  palette: {
    primary: {
      main: '#6396C1', // Blue
    },
    secondary: {
      main: '#BF7D56', // Orange/Brown
    },
    error: {
      main: '#8F271E', // Red
    },
    navy: {
      main: '#1F2646', // Dark Navy
      light: '#4A5568', // Lighter shade for variants
      dark: '#0D1426', // Darker shade
      contrastText: '#FFFFFF',
    },
    olive: {
      main: '#6B6948', // Olive Green
      light: '#9B9870', // Lighter shade
      dark: '#3D3C2A', // Darker shade
      contrastText: '#FFFFFF',
    },
  },
  typography: {
    fontFamily: 'Outfit, sans-serif',
    h1: {
      fontFamily: 'Outfit, sans-serif',
      fontWeight: 500, // Medium
    },
    h2: {
      fontFamily: 'Outfit, sans-serif',
      fontWeight: 500,
    },
    h3: {
      fontFamily: 'Outfit, sans-serif',
      fontWeight: 500,
    },
    h4: {
      fontFamily: 'Outfit, sans-serif',
      fontWeight: 500,
    },
    h5: {
      fontFamily: 'Outfit, sans-serif',
      fontWeight: 500,
    },
    h6: {
      fontFamily: 'Outfit, sans-serif',
      fontWeight: 500,
    },
    body1: {
      fontFamily: 'Outfit, sans-serif',
      fontWeight: 300, // Light
    },
    body2: {
      fontFamily: 'Outfit, sans-serif',
      fontWeight: 300,
    },
    button: {
      fontFamily: 'Outfit, sans-serif',
      fontWeight: 500,
    },
  },
});

export default theme;