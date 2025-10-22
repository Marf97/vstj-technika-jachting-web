'use client'

import Link from 'next/link'
import { Button, ButtonProps } from '@mui/material'

export default function ButtonLink(props: ButtonProps & { href: string }) {
  const { href, ...rest } = props
  return (
    <Link href={href} style={{ textDecoration: 'none' }}>
      <Button {...rest} />
    </Link>
  )
}
