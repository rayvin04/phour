import Image from 'next/image'
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
  icons: {
    icon: '/branding/phour-fav-icon.png',
    shortcut: '/branding/phour-fav-icon.png',
    apple: '/branding/phour-fav-icon.png',
  },
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body suppressHydrationWarning>
        <ClerkProvider afterSignOutUrl="/">
          <ThemeProviderClient>
            <ToastProvider>
              <WorkspaceProvider>
                <header className="auth-header">
                  <Link className="brand" href="/" aria-label="Phour home">
                    <Image
                      src="/branding/phour-name-logo.png"
                      alt="Phour logo"
                      width={132}
                      height={30}
                      priority
                      className="brand-image"
                    />
                  </Link>
                  <div className="auth-actions"><AuthControls /></div>
                </header>
                {children}
              </WorkspaceProvider>
            </ToastProvider>
          </ThemeProviderClient>
        </ClerkProvider>
      </body>
    </html>
  )
}
