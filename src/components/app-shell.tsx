'use client'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useUser } from '@clerk/nextjs'
import React, { useEffect } from 'react'

const items: Array<[string,string,React.ReactNode?]> = [
  ['Today','/','🏠'],
  ['Tasks','/tasks','✅'],
  ['Habits','/habits','🔁'],
  ['Focus timer','/focus-timer','⏱️'],
  ['Insights','/insights','📊'],
  ['Files','/files','📁'],
]

export function AppShell({ children }: { children: React.ReactNode }) {
  const path = usePathname()
  const router = useRouter()
  const { isLoaded, user } = useUser()

  useEffect(() => {
    if (isLoaded && !user) {
      router.replace('/')
    }
  }, [isLoaded, router, user])

  if (!isLoaded || !user) {
    return null
  }

  return (
    <main className="shell">
      <aside className="sidebar">
        <nav aria-label="Main navigation">
          {items.map(([label, href, icon]) => (
            <Link className={path === href ? 'active' : ''} href={href} key={href}>
              <span className="nav-icon" aria-hidden>{icon}</span>
              <span className="nav-label">{label}</span>
            </Link>
          ))}
        </nav>
        <p className="sidebar-note">Make space for what matters.</p>
      </aside>
      <section className="content">{children}</section>
    </main>
  )
}
