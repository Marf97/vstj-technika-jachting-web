// src/components/NavLink.tsx
'use client'
import Link from 'next/link'
import { ButtonBase } from '@mui/material'
import { usePathname } from 'next/navigation'

export default function NavLink({
  href, children,
}: { href: string; children: React.ReactNode }) {
  const pathname = usePathname()
  const active = pathname === href || pathname.startsWith(href + '/')

  return (
    <Link href={href} style={{ textDecoration: 'none' }}>
      <ButtonBase
        disableRipple
        sx={{
          px: 2, py: 1,
          borderRadius: 1,
          color: 'primary.contrastText',
          textTransform: 'none',
          fontWeight: 600,
          opacity: active ? 1 : 0.9,
          border: active ? '1px solid rgba(255,255,255,0.9)' : '2px solid transparent',
          borderBottom: active ? '3px solid rgba(255,255,255,0.9)' : '2px solid transparent',
          '&:hover': { backgroundColor: 'rgba(255,255,255,0.12)', opacity: 1 },
        }}
      >
        {children}
      </ButtonBase>
    </Link>
  )
}
