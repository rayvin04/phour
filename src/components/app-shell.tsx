'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useUser } from '@clerk/nextjs'
import React, { useEffect, useState } from 'react'
import {
  BarChartIcon,
  CheckSquareIcon,
  FolderIcon,
  HomeIcon,
  RepeatIcon,
  StickyNoteIcon,
  TimerIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from '@/components/ui/icons'

type NavItem = {
  label: string
  href: string
  icon: React.ComponentType<{ size?: number; className?: string }>
}

const NAV_ITEMS: NavItem[] = [
  { label: 'Today', href: '/', icon: HomeIcon },
  { label: 'Tasks', href: '/tasks', icon: CheckSquareIcon },
  { label: 'Habits', href: '/habits', icon: RepeatIcon },
  { label: 'Focus timer', href: '/focus-timer', icon: TimerIcon },
  { label: 'Insights', href: '/insights', icon: BarChartIcon },
  { label: 'Files', href: '/files', icon: FolderIcon },
  { label: 'Notes', href: '/notes', icon: StickyNoteIcon },
]

export function AppShell({ children }: { children: React.ReactNode }) {
  const path = usePathname()
  const router = useRouter()
  const { isLoaded, user } = useUser()
  const [collapsed, setCollapsed] = useState(false)

  useEffect(() => {
    setCollapsed(window.localStorage.getItem('phour_sidebar_collapsed') === 'true')
  }, [])

  function toggleSidebar() {
    setCollapsed((value) => {
      const next = !value
      window.localStorage.setItem('phour_sidebar_collapsed', String(next))
      return next
    })
  }

  useEffect(() => {
    if (isLoaded && !user) {
      router.replace('/')
    }
  }, [isLoaded, router, user])

  if (!isLoaded || !user) {
    return (
      <main className="shell">
        <aside className="sidebar" aria-label="Sidebar navigation">
          <nav aria-label="Main navigation">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon
              return (
                <span className="sidebar-skeleton-link" key={item.href} aria-hidden="true">
                  <span className="nav-icon"><Icon size={17} /></span>
                  <span className="nav-label">{item.label}</span>
                </span>
              )
            })}
          </nav>
        </aside>
        <section className="content">
          <div className="page-intro">
            <div className="skeleton" style={{ width: 160, height: 28, marginBottom: 12 }} />
            <div className="skeleton" style={{ width: 300, height: 36 }} />
          </div>
        </section>
      </main>
    )
  }

  return (
    <main className={`shell${collapsed ? ' shell--sidebar-collapsed' : ''}`}>
      <aside className="sidebar" aria-label="Sidebar navigation">
        <button type="button" className="sidebar-collapse" onClick={toggleSidebar} aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'} title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}>
          {collapsed ? <ChevronRightIcon size={16} /> : <ChevronLeftIcon size={16} />}
        </button>
        <nav aria-label="Main navigation">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon
            const isActive = path === item.href
            return (
              <Link
                className={isActive ? 'active' : ''}
                href={item.href}
                key={item.href}
                prefetch={true}
                  aria-current={isActive ? 'page' : undefined}
                title={item.label}
              >
                <span className="nav-icon" aria-hidden="true">
                  <Icon size={17} />
                </span>
                <span className="nav-label">{item.label}</span>
              </Link>
            )
          })}
        </nav>
        <p className="sidebar-note">Make space for what matters.</p>
      </aside>
      <section className={`content${path === '/notes' ? ' content--canvas' : ''}`}>{children}</section>
    </main>
  )
}
