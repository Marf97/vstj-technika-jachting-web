import Hero from '@/components/widgets/Hero'
import NewsList from '@/components/widgets/NewsList'
import { OpeningHoursCard, QuickLinksCard, NewsletterCard } from '@/components/widgets/RightColumn'
import { Container, Paper, Stack, Typography, Grid } from '@mui/material'
import ButtonLink from '@/components/ui/ButtonLink'
import { prisma } from '@/lib/db'

export default async function HomePage() {
  // mock/DB data – můžeš nahradit vlastní tabulkou "news_posts"
  const eventsCount = await prisma.event.count()
  const news = [
    { id: '1', title: 'Toto je Náš předseda', img: '/danik.jpg' },
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
                  <Typography variant="h5">Novinky</Typography>
                  <ButtonLink href="/news" variant="text">více</ButtonLink>
                </Stack>
                <NewsList items={news} />
              </Paper>

              <Paper sx={{ p: 2 }}>
                <Stack direction="row" alignItems="center" justifyContent="space-between">
                  <Typography variant="h5">Kalendář akcí</Typography>
                  <ButtonLink href="/calendar" variant="contained" color="secondary">Zobrazit kalendář</ButtonLink>
                </Stack>
                <Typography variant="body2" sx={{ mt: 1 }}>
                  Nadcházejících akcí: {eventsCount}
                </Typography>
              </Paper>

              <Paper sx={{ p: 2 }}>
                <Typography variant="h5" sx={{ mb: 1 }}>Náš tým</Typography>
                <Typography variant="body2">Daník, Rusáček, Kobík, Péťa Admirál a další banda lidí co se do toho nechali uvrtat</Typography>
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
