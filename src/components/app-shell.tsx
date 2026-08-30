'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import React from 'react'

const items: Array<[string,string,React.ReactNode?]> = [
  ['Today','/','🏠'],
  ['Tasks','/tasks','✅'],
  ['Habits','/habits','🔁'],
  ['Focus timer','/focus-timer','⏱️'],
  ['Insights','/insights','📊'],
  ['Files','/files','📁']
]

export function AppShell({ children }: { children: React.ReactNode }) {
  const path = usePathname()
  return (
    <main className="shell">
      <aside className="sidebar">
        <Link className="side-brand" href="/">phour<span>•</span></Link>
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
