import Hero from '@/components/widgets/Hero'
import NewsList from '@/components/widgets/NewsList'
import { Container, Paper, Stack, Typography, Grid } from '@mui/material'
import ButtonLink from '@/components/ui/ButtonLink'
import { getSession } from "@/lib/auth";

// volitelné – pokud použiješ separátní komponenty bannerů:
import GuestBanner from "@/components/widgets/GuestBanner";
import MemberBanner from "@/components/widgets/MemberBanner";
import AdminBanner from "@/components/widgets/AdminBanner";

export default async function HomePage() {
  // mock/DB data – můžeš nahradit vlastní tabulkou "news_posts"
  const session = await getSession();
  const role = session?.user?.role ?? "GUEST";
  const news = [
    { id: '1', title: 'Toto je Náš předseda', img: '/danik.jpg' },
  ]

  return (
    <>
      <Hero />

      <Container sx={{ my: 4 }}>
        <Grid container justifyContent="center">
          <Grid size={{ xs:12}}>
            <Stack spacing={3}>
              <Paper sx={{ p: 2, display: "flex", justifyContent: "center"}}>
                  {role === "GUEST" && <GuestBanner />}
                  {role === "MEMBER" && <MemberBanner />}
                  {role === "ADMIN" && <AdminBanner />}
              </Paper>
              <Paper sx={{ p: 2 }}>
                <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
                  <Typography variant="h5">Novinky</Typography>
                  <ButtonLink href="/news" variant="text">více</ButtonLink>
                </Stack>
                <NewsList items={news} />
              </Paper>

              <Paper sx={{ p: 2 }}>
                <Typography variant="h5" sx={{ mb: 1 }}>Náš tým</Typography>
                <Typography variant="body2">Daník, Rusáček, Kobík, Péťa Admirál a další banda lidí co se do toho nechali uvrtat</Typography>
              </Paper>
            </Stack>
          </Grid>
        </Grid>
      </Container>
    </>
  )
}
