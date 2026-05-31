import React from "react";
import { Alert, Box, Button, Paper, Typography } from "@mui/material";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import { useMemberAuth } from "../lib/auth";
import MemberCalendar from "./MemberCalendar";

const NEW_RESERVATION_FORM_URL =
  "https://forms.cloud.microsoft/Pages/ResponsePage.aspx?id=D7ZPjqAN20CQiuMyQ7lNTQ61bM0yBdlCvmC_M9kXlkJURFA0ODYzOElUWlRTOFZZVTU0QTlWNzdUUi4u";

export default function MemberArea() {
  const { session, loading, error, hasCapability, login, logout } = useMemberAuth();

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
        <Button
          variant="contained"
          onClick={() => login(`${window.location.origin}/clenska-sekce`)}
        >
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
        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1.5 }}>
          {hasCapability("reservation:create") && (
            <Button
              variant="contained"
              href={NEW_RESERVATION_FORM_URL}
              target="_blank"
              rel="noopener noreferrer"
              endIcon={<OpenInNewIcon fontSize="small" />}
            >
              Nová rezervace
            </Button>
          )}
          <Button variant="outlined" onClick={() => logout(window.location.origin)}>
            Odhlásit
          </Button>
        </Box>
      </Paper>

      <MemberCalendar
        canApproveReservations={hasCapability("reservation:approve")}
        canCancelReservations={hasCapability("reservation:cancel")}
      />
    </Box>
  );
}
