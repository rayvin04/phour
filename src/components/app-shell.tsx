'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
const items = [['Today','/'],['Tasks','/tasks'],['Habits','/habits'],['Focus timer','/focus-timer'],['Insights','/insights']]
export function AppShell({ children }: { children: React.ReactNode }) { const path = usePathname(); return <main className="shell"><aside className="sidebar"><Link className="side-brand" href="/">phour<span>•</span></Link><nav aria-label="Main navigation">{items.map(([label, href]) => <Link className={path === href ? 'active' : ''} href={href} key={href}>{label}</Link>)}</nav><p className="sidebar-note">Make space for what matters.</p></aside><section className="content">{children}</section></main> }
