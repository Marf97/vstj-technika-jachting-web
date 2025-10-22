'use client'
import { createTheme } from '@mui/material/styles'

export const makeTheme = (mode: 'light' | 'dark') =>
  createTheme({
    palette: {
      mode,
      primary: { main: '#45688B' },
      secondary: { main: '#ED443E' },
      background: {
        default: mode === 'light' ? '#FFFBF0' : '#121212',
        paper: mode === 'light' ? '#fff' : '#1e1e1e',
      },
    },
    shape: { borderRadius: 10 },
  })
