import React, { useCallback, useMemo, useState } from "react";
import { useTheme } from "@mui/material/styles";
import useMediaQuery from "@mui/material/useMediaQuery";
import { useLocation, useNavigate } from "react-router-dom";
import AppBar from "@mui/material/AppBar";
import Box from "@mui/material/Box";
import Divider from "@mui/material/Divider";
import Drawer from "@mui/material/Drawer";
import IconButton from "@mui/material/IconButton";
import List from "@mui/material/List";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemText from "@mui/material/ListItemText";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";
import MenuIcon from "@mui/icons-material/Menu";
import { useMemberAuth } from "../lib/auth";

export default function Header({ onNavClick }) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const navigate = useNavigate();
  const location = useLocation();
  const { session, login, logout } = useMemberAuth();
  const [drawerOpen, setDrawerOpen] = useState(false);

  const handleNavClick = useCallback(
    (section, navigateToPath = null, forceNavigate = false) => {
      if (
        navigateToPath &&
        (forceNavigate || location.pathname !== navigateToPath)
      ) {
        navigate(navigateToPath, {
          state: { scrollTo: section.toLowerCase().replace(/\s+/g, "") },
        });
      } else if (onNavClick) {
        const sectionId = section.toLowerCase().replace(/\s+/g, "");
        onNavClick(sectionId);
      }
    },
    [location.pathname, navigate, onNavClick]
  );

  const navItems = useMemo(() => {
    const items = [
      { label: "O nás", action: () => handleNavClick("O nás", "/") },
      { label: "Kontakt", action: () => handleNavClick("Kontakt", "/") },
      { label: "Galerie", action: () => handleNavClick("Galerie", "/") },
      {
        label: "Novinky",
        action: () => handleNavClick("Novinky", "/novinky", true),
      },
      {
        label: "Naše lodě",
        action: () => handleNavClick("Naše lodě", "/nase-lode"),
      },
    ];

    if (session.authenticated) {
      items.push({
        label: "Členská sekce",
        action: () => navigate("/clenska-sekce"),
      });
    }

    return items;
  }, [handleNavClick, session.authenticated, navigate]);

  const authItem = session.authenticated
    ? {
        label: "Odhlásit",
        action: () => logout(window.location.origin),
      }
    : {
        label: "Přihlásit",
        action: () => login(`${window.location.origin}/clenska-sekce`),
      };

  const closeDrawer = () => setDrawerOpen(false);

  return (
    <>
      <AppBar
        position="static"
        sx={{
          backgroundImage: "url(/header-background.JPG)",
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
          height: { xs: "200px", sm: "250px" },
          elevation: 0,
          position: "relative",
          "&::before": {
            content: '""',
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: theme.palette.navy.main + "b3",
            zIndex: 1,
          },
        }}
      >
        <Toolbar
          disableGutters
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            height: "100%",
            position: "relative",
            zIndex: 2,
            px: { xs: 2, sm: 0 },
            py: { xs: 2, sm: 0 },
          }}
        >
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: { xs: 1.5, sm: 2 },
              maxWidth: { xs: "calc(100% - 64px)", sm: "none" },
            }}
          >
            <img
              src="/logo/Logo_bile_zkracene.svg"
              alt="VŠTJ Logo"
              style={{
                height: "auto",
                width: "auto",
                maxHeight: isMobile ? "70px" : "100px",
                maxWidth: isMobile ? "90px" : "200px",
              }}
            />
            <Typography
              variant="h4"
              sx={{
                color: "common.white",
                textDecoration: "none",
                fontSize: { xs: "1rem", sm: "1.5rem", md: "2rem" },
                lineHeight: 1.2,
                maxWidth: { xs: "190px", sm: "none" },
              }}
            >
              VŠTJ Technika Jachting Praha
            </Typography>
          </Box>

          <IconButton
            color="inherit"
            aria-label="Otevřít menu"
            onClick={() => setDrawerOpen(true)}
            sx={{
              color: "common.white",
              mt: { xs: 0.5, sm: 1.5 },
              mr: { xs: 0.5, sm: 1.5 },
              border: "1px solid",
              borderColor: "rgba(255,255,255,0.35)",
              bgcolor: "rgba(255,255,255,0.08)",
              borderRadius: 1.5,
              px: 1.25,
              py: 0.75,
              "&:hover": {
                bgcolor: "rgba(255,255,255,0.16)",
              },
            }}
          >
            <MenuIcon />
          </IconButton>
        </Toolbar>
      </AppBar>

      <Drawer
        anchor="right"
        open={drawerOpen}
        onClose={closeDrawer}
        PaperProps={{
          sx: {
            width: 280,
            bgcolor: "navy.main",
            color: "common.white",
          },
        }}
      >
        <Box sx={{ px: 3, py: 2.5 }}>
          <Typography variant="h6" sx={{ fontWeight: 500 }}>
            VŠTJ Technika Jachting
          </Typography>
        </Box>

        <Divider sx={{ borderColor: "rgba(255,255,255,0.12)" }} />

        <List sx={{ pt: 1 }}>
          {navItems.map((item) => (
            <ListItemButton
              key={item.label}
              onClick={() => {
                closeDrawer();
                item.action();
              }}
              sx={{ py: 1.5, px: 3 }}
            >
              <ListItemText primary={item.label} />
            </ListItemButton>
          ))}
        </List>

        <Divider sx={{ borderColor: "rgba(255,255,255,0.12)" }} />

        <List>
          <ListItemButton
            onClick={() => {
              closeDrawer();
              authItem.action();
            }}
            sx={{ py: 1.5, px: 3 }}
          >
            <ListItemText primary={authItem.label} />
          </ListItemButton>
        </List>
      </Drawer>
    </>
  );
}
