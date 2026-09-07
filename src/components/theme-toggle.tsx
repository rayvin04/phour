'use client'

import React, { useEffect, useState } from 'react'
import { useTheme } from 'next-themes'
import { useUser } from '@clerk/nextjs'
import { MonitorIcon, MoonIcon, SunIcon } from '@/components/ui/icons'

export function ThemeToggle() {
  const { theme, setTheme, resolvedTheme } = useTheme()
  const { isLoaded, user } = useUser()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true)
  }, [])
  if (!mounted) return <div className="theme-toggle-placeholder" aria-hidden="true" />

  const current = theme === 'system' ? resolvedTheme : theme

  async function cycle() {
    const next = theme === 'system' ? 'light' : theme === 'light' ? 'dark' : 'system'
    setTheme(next)
    try {
      if (isLoaded && user) {
        await fetch('/api/settings', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ theme: next }),
        })
      }
    } catch {
      // ignore
    }
  }

  const label = theme === 'system' ? `Theme: system (${resolvedTheme})` : `Theme: ${theme}`

  return (
    <button
      className="icon-button theme-toggle"
      onClick={cycle}
      aria-label={label}
      title={label}
      type="button"
    >
      {current === 'dark' ? (
        <MoonIcon size={16} />
      ) : current === 'light' ? (
        <SunIcon size={16} />
      ) : (
        <MonitorIcon size={16} />
      )}
    </button>
  )
}
