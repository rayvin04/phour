'use client'

import React, { useEffect, useState } from 'react'
import { useTheme } from 'next-themes'
import { useUser } from '@clerk/nextjs'

export function ThemeToggle() {
  const { theme, setTheme, resolvedTheme } = useTheme()
  const { isLoaded, user } = useUser()
  const [mounted, setMounted] = useState(false)

  useEffect(() => { setMounted(true) }, [])
  if (!mounted) return null

  const current = theme === 'system' ? resolvedTheme : theme

  async function cycle() {
    const next = theme === 'system' ? 'light' : theme === 'light' ? 'dark' : 'system'
    setTheme(next)
    // persist
    try {
      if (isLoaded && user) {
        await fetch('/api/settings', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ theme: next }) })
      } else {
        // local persistence is handled by next-themes
      }
    } catch (e) {
      // ignore
    }
  }

  return (
    <button className="icon-button theme-toggle" onClick={cycle} aria-label={`Theme: ${current}`} title={`Theme: ${current}`}>
      {current === 'dark' ? '🌙' : current === 'light' ? '☀️' : '🖥️'}
    </button>
  )
}
