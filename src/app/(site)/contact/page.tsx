'use client';

import { Box, Paper, Stack, Typography, Grid, TextField, Button, Link, Divider, Card, CardMedia, CardContent } from '@mui/material';

export default function ContactPage() {
  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    // TODO: napojit na API / e-mail podle potřeby
    // Zatím jen výpis do konzole:
    console.log('Kontakt form:', Object.fromEntries(data.entries()));
  }

  return (
    <Stack spacing={3}>
      <Box>
        <Typography variant="h4" fontWeight={700} gutterBottom>
          Kontakt
        </Typography>
        <Typography color="text.secondary">
          Máš dotaz k členství, tréninkům nebo akcím? Ozvi se nám – rádi poradíme.
        </Typography>
      </Box>

      {/* Info + Form */}
      <Grid container spacing={3} alignItems="stretch">
        <Grid size={{xs: 12, md : 6}}>
          <Paper sx={{ p: 3, height: '100%' }}>
            <Typography variant="h6" gutterBottom>
              Klubové kontakty
            </Typography>

            <Stack spacing={2}>
              <Box>
                <Typography variant="subtitle2" gutterBottom>
                  Adresa
                </Typography>
                <Typography>
                  VŠTJ Technika – Jachting ČVUT<br />
                  (doplňte přesnou adresu klubu / loděnice)<br />
                  120 00 Praha
                </Typography>
              </Box>

              <Box>
                <Typography variant="subtitle2" gutterBottom>
                  E-mail
                </Typography>
                <Link href="mailto:info@vstj-jachting.cz">info@vstj-jachting.cz</Link>
              </Box>

              <Box>
                <Typography variant="subtitle2" gutterBottom>
                  Telefon
                </Typography>
                <Typography component="div">
                  <Link href="tel:+420123456789">+420&nbsp;123&nbsp;456&nbsp;789</Link><br />
                  (Po–Pá 9:00–17:00)
                </Typography>
              </Box>

              <Box>
                <Typography variant="subtitle2" gutterBottom>
                  Otevírací doba / dostupnost
                </Typography>
                <Typography>
                  Tréninky a akce dle kalendáře. Pro návštěvu loděnice se prosím domluv předem.
                </Typography>
              </Box>

              <Divider />

              <Box>
                <Typography variant="subtitle2" gutterBottom>
                  Sociální sítě
                </Typography>
                <Stack direction="row" spacing={2}>
                  <Link href="#" underline="hover">Facebook</Link>
                  <Link href="#" underline="hover">Instagram</Link>
                  <Link href="#" underline="hover">YouTube</Link>
                </Stack>
              </Box>
            </Stack>
          </Paper>
        </Grid>

        {/* Formulář */}
        <Grid size={{xs: 12, md : 6}}>
          <Paper sx={{ p: 3, height: '100%'}}>
            <Typography variant="h6" gutterBottom>
              Napiš nám
            </Typography>

            <Box component="form" onSubmit={handleSubmit}>
              <Stack spacing={2}>
                <TextField
                  name="name"
                  label="Jméno a příjmení"
                  autoComplete="name"
                  required
                  fullWidth
                />
                <TextField
                  name="email"
                  type="email"
                  label="E-mail"
                  autoComplete="email"
                  required
                  fullWidth
                />
                <TextField
                  name="subject"
                  label="Předmět"
                  fullWidth
                />
                <TextField
                  name="message"
                  label="Zpráva"
                  required
                  multiline
                  minRows={4}
                  fullWidth
                />
                <Stack direction="row" justifyContent="flex-end">
                  <Button type="submit" variant="contained">
                    Odeslat
                  </Button>
                </Stack>
              </Stack>
            </Box>

            <Typography variant="caption" color="text.secondary" sx={{ mt: 2, display: 'block' }}>
              Odesláním souhlasíš se zpracováním sdělených údajů pro účely zpětného kontaktování.
            </Typography>
          </Paper>
        </Grid>
      </Grid>

      
    {/* Sekce: Výbor klubu */}
    <Box sx={{ mt: 4 }}>
    <Typography variant="h5" fontWeight={700} gutterBottom>
        Výbor klubu
    </Typography>
    <Typography color="text.secondary" sx={{ mb: 3 }}>
        Seznam členů výboru klubu – lidé, kteří drží kormidlo správným směrem.
    </Typography>

    <Grid container spacing={3}>
        {[
        { name: 'Ing. Petr Admirál', role: 'Předseda klubu', img: 'https://randomuser.me/api/portraits/men/45.jpg' },
        { name: 'Mgr. Jana Kormidelníková', role: 'Místopředsedkyně', img: 'https://randomuser.me/api/portraits/women/68.jpg' },
        { name: 'Bc. Tomáš Plachta', role: 'Hospodář', img: 'https://randomuser.me/api/portraits/men/23.jpg' },
        { name: 'Lucie Kotva', role: 'Tajemnice klubu', img: 'https://randomuser.me/api/portraits/women/22.jpg' },
        { name: 'Michal Vítr', role: 'Technický správce', img: 'https://randomuser.me/api/portraits/men/75.jpg' },
        { name: 'Eliška Vlna', role: 'Propagace a komunikace', img: 'https://randomuser.me/api/portraits/women/32.jpg' },
        { name: 'Jan Kapitán', role: 'Trenér a mentor', img: 'https://randomuser.me/api/portraits/men/56.jpg' },
        { name: 'Tereza Přístavní', role: 'Administrativa', img: 'https://randomuser.me/api/portraits/women/60.jpg' },
        { name: 'Jakub Bouřlivý', role: 'Bezpečnost na vodě', img: 'https://randomuser.me/api/portraits/men/11.jpg' },
        ].map((m) => (
        <Grid key={m.name} size={{ xs: 12, sm: 6, md: 4 }}>
            <Card
            sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                textAlign: 'center',
                height: '100%',
                p: 2,
            }}
            >
            <CardMedia
                component="img"
                image={m.img}
                alt={m.name}
                sx={{
                width: 120,
                height: 120,
                borderRadius: '50%',
                objectFit: 'cover',
                mb: 2,
                }}
            />
            <CardContent sx={{ p: 0 }}>
                <Typography variant="h6">{m.name}</Typography>
                <Typography variant="body2" color="text.secondary">
                {m.role}
                </Typography>
            </CardContent>
            </Card>
        </Grid>
        ))}
    </Grid>
    </Box>

      {/* Mapa / umístění – placeholder (nahraďte iframe Google Maps) */}
      <Paper sx={{ p: 0, overflow: 'hidden' }}>
        <Box
          sx={{
            position: 'relative',
            width: '100%',
            // 16:9 poměr
            pt: '56.25%',
            bgcolor: 'grey.200',
          }}
        >
          <Box
            sx={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
          <Box
            component="iframe"
            src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d1279.3581869021516!2d14.392634771157736!3d50.11031555037635!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x470b950395ce14bd%3A0xdc23fe4438a66802!2zxIxWVVQgLSDDmnN0YXYgdMSbbGVzbsOpIHbDvWNob3Z5IGEgc3BvcnR1!5e0!3m2!1scs!2scz!4v1761767740237!5m2!1scs!2scz"
            allowFullScreen
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            sx={{
                position: 'absolute',
                inset: 0,
                border: 0,
                width: '100%',
                height: '100%',
            }}
            />
          </Box>
        </Box>
      </Paper>
    </Stack>
  );
}
