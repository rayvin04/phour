import { ClerkProvider } from '@clerk/nextjs'
import { AuthControls } from './auth-controls'
import './globals.css'
import { WorkspaceProvider } from '@/lib/workspace-provider'

export const metadata = {
  title: 'Phour — intentional productivity',
  description: 'A calm workspace for focused, intentional work.',
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body suppressHydrationWarning><ClerkProvider><WorkspaceProvider><header className="auth-header"><a className="brand" href="/" aria-label="Phour home">phour<span>•</span></a><div className="auth-actions"><AuthControls /></div></header>{children}</WorkspaceProvider></ClerkProvider></body></html>
}
