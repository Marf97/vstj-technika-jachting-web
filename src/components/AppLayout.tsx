'use client'

import * as React from 'react'
import { CssBaseline, Container } from '@mui/material'
import SiteHeader from '@/components/SiteHeader'
import SiteFooter from '@/components/SiteFooter'

export default function AppLayout({ children }: { children: React.ReactNode }) {

  return (
    <>
      <CssBaseline />

      <SiteHeader />

      <Container sx={{ py: 3 }}>
        {children}
      </Container>

      <SiteFooter />
    </>
  )
}
