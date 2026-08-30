'use client'

import { SignInButton, SignUpButton, UserButton, useUser } from '@clerk/nextjs'
import { ThemeToggle } from '@/components/theme-toggle'

export function AuthControls() {
  const { isLoaded, user } = useUser()
  if (!isLoaded) return <div className="auth-placeholder" aria-hidden="true" />
  if (user) return <span className="auth-controls"><ThemeToggle /><span className="avatar-ring"><UserButton /></span></span>
  return <span className="auth-controls"><ThemeToggle /><SignInButton mode="modal"><button className="signin">Sign in</button></SignInButton><SignUpButton mode="modal"><button className="signup">Get started</button></SignUpButton></span>
}
