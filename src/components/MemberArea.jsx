import React, { useEffect, useState } from "react";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Paper,
  Typography,
} from "@mui/material";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { useMemberAuth } from "../lib/auth";
import qrPaymentImage from "../content/member/qr_platba.jpeg";
import MemberCalendar from "./MemberCalendar";

const NEW_RESERVATION_FORM_URL =
  "https://forms.cloud.microsoft/Pages/ResponsePage.aspx?id=D7ZPjqAN20CQiuMyQ7lNTQ61bM0yBdlCvmC_M9kXlkJURFA0ODYzOElUWlRTOFZZVTU0QTlWNzdUUi4u";
const NEW_CLUB_EVENT_FORM_URL =
  "https://technikapraha.sharepoint.com/:l:/s/jachting/JABh-TKT5R-hRbYAok7o50qaATMgn6ck38tfpcyF8vrtkP0?nav=MDM4NWMyNjAtOTkxZC00Mzk0LWFjYzYtMzY0OGVlNjA5YWQ3";

const MEMBER_PAGES = {
  calendar: {
    title: "Členská sekce",
  },
  priceList: {
    title: "Ceník lodí",
    loadContent: () =>
      import("../content/member/cenik-lodi.md?raw").then(
        (module) => module.default
      ),
  },
  rentalRules: {
    title: "Pravidla půjčování",
    loadContent: () =>
      import("../content/member/pravidla-pujcovani.md?raw").then(
        (module) => module.default
      ),
  },
};

const MARKDOWN_IMAGE_SOURCES = {
  "qr_platba.jpeg": qrPaymentImage,
};

function MemberMarkdownPage({ page }) {
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(Boolean(page?.loadContent));
  const [error, setError] = useState(null);

  useEffect(() => {
    let active = true;

    if (!page?.loadContent) {
      setContent("");
      setLoading(false);
      setError(null);
      return () => {
        active = false;
      };
    }

    setLoading(true);
    setError(null);

    page
      .loadContent()
      .then((text) => {
        if (active) {
          setContent(text);
        }
      })
      .catch((err) => {
        if (active) {
          setError(err.message || "Nepodařilo se načíst členský obsah.");
          setContent("");
        }
      })
      .finally(() => {
        if (active) {
          setLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [page]);

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
        <CircularProgress size={32} />
      </Box>
    );
  }

  if (error) {
    return <Alert severity="error">{error}</Alert>;
  }

  return (
    <Box
      sx={{
        "& h1, & h2, & h3, & h4, & h5, & h6": {
          color: "primary.main",
          fontWeight: 500,
          wordBreak: "break-word",
          overflowWrap: "break-word",
        },
        "& h1": {
          fontSize: { xs: "2rem", sm: "2.5rem" },
          mb: 2,
        },
        "& h2": {
          fontSize: { xs: "1.5rem", sm: "2rem" },
          mt: 3,
          mb: 1.5,
        },
        "& p": {
          color: "text.primary",
          fontWeight: 300,
          wordBreak: "break-word",
          overflowWrap: "break-word",
        },
        "& ul, & ol": {
          color: "text.primary",
          fontWeight: 300,
          pl: 3,
          wordBreak: "break-word",
          overflowWrap: "break-word",
        },
        "& li": {
          mb: 0.5,
        },
        "& a": {
          color: "primary.main",
          fontWeight: 500,
        },
        "& table": {
          width: "100%",
          borderCollapse: "collapse",
          my: 2,
        },
        "& th, & td": {
          border: "1px solid",
          borderColor: "divider",
          p: 1.25,
          textAlign: "left",
        },
        "& th": {
          bgcolor: "action.hover",
          color: "primary.main",
          fontWeight: 500,
        },
      }}
    >
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          img({ src, alt }) {
            const resolvedSrc = src
              ? MARKDOWN_IMAGE_SOURCES[src] || src
              : undefined;

            return (
              <Box
                component="img"
                src={resolvedSrc}
                alt={alt || ""}
                sx={{
                  display: "block",
                  width: "min(100%, 320px)",
                  height: "auto",
                  my: 2,
                  borderRadius: 1,
                  boxShadow: 1,
                }}
              />
            );
          },
        }}
      >
        {content || "Obsah zatím není k dispozici."}
      </ReactMarkdown>
    </Box>
  );
}

export default function MemberArea({ pageKey = "calendar" }) {
  const { session, loading, error, hasCapability, login, logout } =
    useMemberAuth();
  const page = MEMBER_PAGES[pageKey] || MEMBER_PAGES.calendar;

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
          {page.title}
        </Typography>
        {error && (
          <Alert severity="warning" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        <Typography sx={{ mb: 3 }}>
          Po přihlášení přes Microsoft se odemkne neveřejný obsah určený pro
          členy.
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
          {page.title}
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
          {hasCapability("club_event:create") && (
            <Button
              variant="contained"
              href={NEW_CLUB_EVENT_FORM_URL}
              target="_blank"
              rel="noopener noreferrer"
              endIcon={<OpenInNewIcon fontSize="small" />}
            >
              Nová klubová událost
            </Button>
          )}
          <Button variant="outlined" onClick={() => logout(window.location.origin)}>
            Odhlásit
          </Button>
        </Box>
      </Paper>

      {pageKey === "calendar" ? (
        <MemberCalendar
          canApproveReservations={hasCapability("reservation:approve")}
          canCancelReservations={hasCapability("reservation:cancel")}
          canDeleteClubEvents={hasCapability("club_event:delete")}
        />
      ) : (
        <Paper elevation={2} sx={{ p: { xs: 2.5, sm: 4 } }}>
          <MemberMarkdownPage page={page} />
        </Paper>
      )}
    </Box>
  );
}
