import React from 'react'
import Button from '@mui/material/Button'
import { useTheme } from '@mui/material/styles'

export default function NavButton({ children, ...props }) {
  const theme = useTheme()

  return (
    <Button
      color="inherit"
      variant="text"
      sx={{
        textTransform: 'none',
        color: 'common.white',
        px: 3,
        py: 2,
        fontSize: '1.1rem',
        borderRadius: 0,
        '&:hover': {
          backgroundColor: theme.palette.common.white + '3', // 10% white opacity
        }
      }}
      {...props}
    >
      {children}
    </Button>
  )
}