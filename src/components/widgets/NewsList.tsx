import { Card, CardActionArea, CardContent, CardMedia, Typography, Grid } from '@mui/material'

export default function NewsList({ items }: { items: Array<{ id: string; title: string; img?: string; excerpt?: string }> }) {
  return (
    <Grid container spacing={2}>
      {items.map(n => (
        <Grid size={{ xs: 12, sm: 6, md: 4 }} key={n.id}>
          <Card>
            <CardActionArea href={`/news/${n.id}`}>
              {n.img && <CardMedia component="img" height="160" image={n.img} alt={n.title} />}
              <CardContent>
                <Typography variant="h6">{n.title}</Typography>
                {n.excerpt && <Typography variant="body2" color="text.secondary">{n.excerpt}</Typography>}
              </CardContent>
            </CardActionArea>
          </Card>
        </Grid>
      ))}
    </Grid>
  )
}