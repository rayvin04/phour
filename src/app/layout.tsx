import Link from 'next/link'
import { ClerkProvider } from '@clerk/nextjs'
import { ToastProvider } from '@/components/ui/toast'
import { WorkspaceProvider } from '@/lib/workspace-provider'
import { AuthControls } from './auth-controls'
import './globals.css'
import { ThemeProviderClient } from '@/components/theme-provider-client'

export const metadata = {
  title: 'Phour — intentional productivity',
  description: 'A calm workspace for focused, intentional work.',
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body suppressHydrationWarning><ClerkProvider><ThemeProviderClient><ToastProvider><WorkspaceProvider><header className="auth-header"><Link className="brand" href="/" aria-label="Phour home">phour<span>•</span></Link><div className="auth-actions"><AuthControls /></div></header>{children}</WorkspaceProvider></ToastProvider></ThemeProviderClient></ClerkProvider></body></html>
}
