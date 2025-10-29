'use client';
import * as React from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, Button, Stack, Divider, Alert, Typography
} from '@mui/material';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';

type Props = {
  open: boolean;
  onCloseAction: () => void;
};


export default function AuthDialog({ open, onCloseAction }: Props) {
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const router = useRouter();

  async function handleCredentialsLogin(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      // Funguje jen pokud máš v NextAuth provider "Credentials"
      const res = await signIn('credentials', {
        redirect: false,
        email,
        password,
      });
      if (res?.error) {
        setError(res.error || 'Přihlášení se nezdařilo.');
      } else {
        onCloseAction();
        router.refresh();
      }
    } catch {
      setError('Credentials provider není nakonfigurovaný. Zkus Google přihlášení.');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleGoogle() {
    await signIn('google'); // přesměruje na Google flow
  }

  return (
    <Dialog open={open} onClose={onCloseAction} fullWidth maxWidth="xs">
      <DialogTitle>Přihlášení</DialogTitle>
      <DialogContent dividers>
        <Stack spacing={2} component="form" onSubmit={handleCredentialsLogin}>
          {!!error && <Alert severity="error">{error}</Alert>}

          <TextField
            label="E-mail"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            fullWidth
          />
          <TextField
            label="Heslo"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            fullWidth
          />

          <Button
            type="submit"
            variant="contained"
            color="secondary"
            disabled={submitting}
            sx={{ textTransform: 'none', fontWeight: 600 }}
          >
            Přihlásit e-mailem
          </Button>
        </Stack>

        <Divider sx={{ my: 2 }}><Typography variant="caption">nebo</Typography></Divider>

        <Stack spacing={1}>
          <Button
            onClick={handleGoogle}
            variant="outlined"
            color="primary"
            sx={{ textTransform: 'none', fontWeight: 600 }}
          >
            Přihlásit přes Google
          </Button>
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onCloseAction}>Zavřít</Button>
      </DialogActions>
    </Dialog>
  );
}
