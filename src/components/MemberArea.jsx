import React from "react";
import { Alert, Box, Button, Paper, Typography } from "@mui/material";
import { useMemberAuth } from "../lib/auth";
import MemberCalendar from "./MemberCalendar";

export default function MemberArea() {
  const { session, loading, error, login, logout } = useMemberAuth();

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
        <Typography color="text.secondary">
          Načítám stav členského přihlášení...
        </Typography>
      </Box>
    );
  }

  if (!session.authenticated) {
    return (
      <Paper elevation={2} sx={{ p: 4 }}>
        <Typography
          variant="h3"
          component="h1"
          sx={{ color: "primary.main", fontWeight: 500, mb: 2 }}
        >
          Členská sekce
        </Typography>
        {error && (
          <Alert severity="warning" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        <Typography sx={{ mb: 3 }}>
          Po přihlášení přes Microsoft se odemkne neveřejný obsah určený pro členy.
        </Typography>
        <Button variant="contained" onClick={() => login(window.location.href)}>
          Přihlásit se pro členy
        </Button>
      </Paper>
    );
  }

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
      <Paper elevation={2} sx={{ p: 4 }}>
        <Typography
          variant="h3"
          component="h1"
          sx={{ color: "primary.main", fontWeight: 500, mb: 1 }}
        >
          Členská sekce
        </Typography>
        <Typography sx={{ mb: 1 }}>
          Přihlášeno jako {session.displayName || session.memberEmail}.
        </Typography>
        {session.memberEmail && (
          <Typography color="text.secondary" sx={{ mb: 3 }}>
            Ověřený účet: {session.memberEmail}
          </Typography>
        )}
        <Button variant="outlined" onClick={() => logout(window.location.origin)}>
          Odhlásit
        </Button>
      </Paper>

      <MemberCalendar />
    </Box>
  );
}
