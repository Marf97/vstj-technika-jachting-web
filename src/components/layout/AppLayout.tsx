import { CssBaseline, Container } from '@mui/material'
import SiteHeader from '@/components/layout/SiteHeader'
import SiteFooter from '@/components/layout/SiteFooter'
import { getSession } from '@/lib/auth'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  const role = (session?.user?.role ?? 'GUEST') as 'GUEST' | 'MEMBER' | 'ADMIN';

  return (
    <>
      <CssBaseline />
      <SiteHeader role={role} />
      <Container sx={{ py: 3 }}>
        {children}
      </Container>
      <SiteFooter />
    </>
  )
}
