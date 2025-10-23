'use client'
import * as React from 'react'
import { ThemeProvider, CssBaseline, IconButton, Tooltip } from '@mui/material'
import { makeTheme } from '@/theme'
import DarkModeIcon from '@mui/icons-material/DarkMode'
import LightModeIcon from '@mui/icons-material/LightMode'
import { AppRouterCacheProvider } from '@mui/material-nextjs/v14-appRouter'
import { SessionProvider } from 'next-auth/react'

export default function Providers({ children }: { children: React.ReactNode }) {
  const [mode, setMode] = React.useState<'light' | 'dark'>('light')

  // (volitelně) načti preferenci z localStorage
  React.useEffect(() => {
    const stored = typeof window !== 'undefined' ? localStorage.getItem('theme-mode') as 'light'|'dark'|null : null
    if (stored) setMode(stored)
  }, [])
  React.useEffect(() => {
    if (typeof window !== 'undefined') localStorage.setItem('theme-mode', mode)
  }, [mode])

  const theme = React.useMemo(() => makeTheme(mode), [mode])

  return (
    <AppRouterCacheProvider options={{ enableCssLayer: true }}>
      <SessionProvider>
        <ThemeProvider theme={theme}>
        <CssBaseline />
        {/* jednoduchý přepínač vpravo dole */}
        <div style={{ position: 'fixed', right: 16, bottom: 16, zIndex: 1300 }}>
            <Tooltip title={mode === 'light' ? 'Přepnout na tmavý' : 'Přepnout na světlý'}>
            <IconButton color="primary" onClick={() => setMode(m => (m === 'light' ? 'dark' : 'light'))}>
                {mode === 'light' ? <DarkModeIcon /> : <LightModeIcon />}
            </IconButton>
            </Tooltip>
        </div>
        {children}
        </ThemeProvider>
      </SessionProvider>
    </AppRouterCacheProvider>
  )
}
