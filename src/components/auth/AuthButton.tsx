'use client';
import * as React from 'react';
import { signOut, useSession } from 'next-auth/react';
import { Button } from '@mui/material';
import AuthDialog from './AuthDialog';

type Props = { className?: string };

export default function AuthButton({ className }: Props) {
  const { data: session, status } = useSession();
  const [open, setOpen] = React.useState(false);
  const loading = status === 'loading';

  if (loading) {
    return (
      <Button
        variant="outlined"
        color="inherit"
        size="small"
        disabled
        className={className}
      >
        …
      </Button>
    );
  }

  if (!session) {
    return (
      <>
        <Button
          onClick={() => setOpen(true)}
          variant="contained"
          color="secondary"
          size="small"
          className={className}
          sx={{ textTransform: 'none', fontWeight: 600 }}
        >
          Přihlásit
        </Button>
        <AuthDialog open={open} onCloseAction={() => setOpen(false)} />
      </>
    );
  }

  return (
    <Button
      onClick={() => signOut({ callbackUrl: '/' })}
      variant="contained"
      color="info"
      size="small"
      className={className}
      sx={{ textTransform: 'none', fontWeight: 600 }}
    >
      Odhlásit
    </Button>
  );
}
