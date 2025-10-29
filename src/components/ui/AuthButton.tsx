'use client'
import { signIn, signOut, useSession } from 'next-auth/react'
import { Button } from '@mui/material'

export default function AuthButtons() {
  const { data: session } = useSession()

  if (session?.user) {
    return <Button 
    variant="outlined"
        color="inherit"
        size="small"
        onClick={() => signOut()}
        sx={{ borderColor: 'primary.contrastText', color: 'primary.contrastText', mr: 2 }}>Odhlásit</Button>
  }
  else{
    return <Button 
        variant="outlined"
        color="inherit"
        size="small" 
        onClick={() => signIn('google')}>Google</Button>
  } 
  
      {/*<Button variant="outlined" onClick={() => signIn('azure-ad')}>Microsoft</Button>*/}
      {/* <Button variant="outlined" onClick={() => signIn()}>E-mail / heslo</Button> */}
}
