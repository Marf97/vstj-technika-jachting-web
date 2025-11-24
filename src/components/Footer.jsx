import React from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Container from "@mui/material/Container";

export default function Footer() {
  return (
    <Box component="footer" sx={{ bgcolor: "navy.main", py: 2 }}>
      <Container maxWidth="lg">
        <Typography variant="body2" color="navy.contrastText" align="center">
          © {new Date().getFullYear()} VŠTJ Technika Jachting
        </Typography>
      </Container>
    </Box>
  );
}
