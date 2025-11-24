import React from "react";
import Button from "@mui/material/Button";
import { useTheme } from "@mui/material/styles";

export default function NavButton({ children, ...props }) {
  const theme = useTheme();

  return (
    <Button
      color="inherit"
      variant="text"
      sx={{
        textTransform: "none",
        color: "common.white",
        px: { xs: 2, sm: 3 },
        py: { xs: 1, sm: 2 },
        fontSize: { xs: "0.9rem", sm: "1.1rem" },
        borderRadius: 0,
        minWidth: { xs: "80px", sm: "auto" },
        "&:hover": {
          backgroundColor: theme.palette.common.white + "3", // 10% white opacity
        },
      }}
      {...props}
    >
      {children}
    </Button>
  );
}
