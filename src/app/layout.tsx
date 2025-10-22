import Providers from './providers'
import AppLayout from '@/components/layout/AppLayout'

export const metadata = { title: 'Klub', description: 'Správa klubu' }

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="cs">
      <body>
        <Providers>
          <AppLayout>{children}</AppLayout>
        </Providers>
      </body>
    </html>
  )
}
