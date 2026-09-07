'use client'

import { SignInButton, SignUpButton, UserButton, useUser } from '@clerk/nextjs'
import { ThemeToggle } from '@/components/theme-toggle'

export function AuthControls() {
  const { isLoaded, user } = useUser()
  if (!isLoaded) return <div className="auth-placeholder" aria-hidden="true" />
  if (user) {
    return (
      <span className="auth-controls">
        <ThemeToggle />
        <span className="avatar-ring" title="Account settings">
          <UserButton />
        </span>
      </span>
    )
  }
  return (
    <span className="auth-controls">
      <ThemeToggle />
      <SignInButton mode="modal">
        <button className="signin" title="Sign in to your account">Sign in</button>
      </SignInButton>
      <SignUpButton mode="modal">
        <button className="signup" title="Create a new account">Get started</button>
      </SignUpButton>
    </span>
  )
}
