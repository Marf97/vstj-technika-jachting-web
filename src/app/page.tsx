import Hero from '@/components/Hero'
import NewsList from '@/components/NewsList'
import { OpeningHoursCard, QuickLinksCard, NewsletterCard } from '@/components/RightColumn'
import { Container, Paper, Stack, Typography, Grid } from '@mui/material'
import ButtonLink from '@/components/ButtonLink'
import { prisma } from '@/lib/db'

export default async function HomePage() {
  // mock/DB data – můžeš nahradit vlastní tabulkou "news_posts"
  const eventsCount = await prisma.event.count()
  const news = [
    { id: '1', title: 'Partnerství pro rozvoj akademie', img: '/next.svg' },
    { id: '2', title: 'Video z našich akcí :-)', img: '/vercel.svg' },
  ]

  return (
    <>
      <Hero />

      <Container sx={{ my: 4 }}>
        <Grid container spacing={3}>
          {/* Hlavní sloupec */}
          <Grid size={{ xs:12, md:8}}>
            <Stack spacing={3}>
              <Paper sx={{ p: 2 }}>
                <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
                  <Typography variant="h5">Čerstvé novinky</Typography>
                  <ButtonLink href="/news" variant="text">Všechny novinky</ButtonLink>
                </Stack>
                <NewsList items={news} />
              </Paper>

              <Paper sx={{ p: 2 }}>
                <Stack direction="row" alignItems="center" justifyContent="space-between">
                  <Typography variant="h5">Kalendář akcí</Typography>
                  <Stack direction="row" spacing={1}>
                  <ButtonLink href="/calendar" variant="contained" color="secondary">Zobrazit kalendář</ButtonLink>
                  <ButtonLink href="/api/ics/feed" variant="outlined">iCal feed</ButtonLink>
                  </Stack>
                </Stack>
                <Typography variant="body2" sx={{ mt: 1 }}>
                  Nadcházejících akcí: {eventsCount}
                </Typography>
              </Paper>

              <Paper sx={{ p: 2 }}>
                <Typography variant="h5" sx={{ mb: 1 }}>Náš tým</Typography>
                <Typography variant="body2">Krátké představení trenérů / vedení klubu (může být prostý výpis, nebo karty).</Typography>
              </Paper>
            </Stack>
          </Grid>

          {/* Pravý sloupec */}
          <Grid size={{ xs:12, md:4}}>
            <Stack spacing={3}>
              <OpeningHoursCard />
              <QuickLinksCard />
              <NewsletterCard />
            </Stack>
          </Grid>
        </Grid>
      </Container>
    </>
  )
}
