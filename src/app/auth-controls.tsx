'use client'

import { SignInButton, SignUpButton, UserButton, useUser } from '@clerk/nextjs'

export function AuthControls() {
  const { isLoaded, user } = useUser()
  if (!isLoaded) return <div className="auth-placeholder" aria-hidden="true" />
  if (user) return <UserButton afterSignOutUrl="/" />
  return <><SignInButton mode="modal"><button className="signin">Sign in</button></SignInButton><SignUpButton mode="modal"><button className="signup">Get started</button></SignUpButton></>
}
