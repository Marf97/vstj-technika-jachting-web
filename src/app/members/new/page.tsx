'use client'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { TextField, Button, Stack, Paper, Typography } from '@mui/material'

const schema = z.object({
  name: z.string().min(2, 'Jméno je povinné'),
  email: z.string().email('Neplatný e-mail'),
})

type FormData = z.infer<typeof schema>

export default function NewMemberPage() {
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  const onSubmit = async (data: FormData) => {
    await fetch('/api/members', { method: 'POST', body: JSON.stringify(data) })
    // toast/snackbar atd.
  }

  return (
    <Paper sx={{ p: 3, maxWidth: 520 }}>
      <Typography variant="h5" sx={{ mb: 2 }}>Nový člen</Typography>
      <Stack spacing={2} component="form" onSubmit={handleSubmit(onSubmit)}>
        <TextField
          label="Jméno"
          {...register('name')}
          error={!!errors.name}
          helperText={errors.name?.message}
        />
        <TextField
          label="E-mail"
          {...register('email')}
          error={!!errors.email}
          helperText={errors.email?.message}
        />
        <Button type="submit" variant="contained" disabled={isSubmitting}>Uložit</Button>
      </Stack>
    </Paper>
  )
}
