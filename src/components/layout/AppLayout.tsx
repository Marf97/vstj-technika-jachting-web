'use client'

import * as React from 'react'
import { CssBaseline, Container } from '@mui/material'
import SiteHeader from '@/components/layout/SiteHeader'
import SiteFooter from '@/components/layout/SiteFooter'

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
