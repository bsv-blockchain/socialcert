import { Link, useLocation } from 'react-router-dom'
import { Shield, ScrollText } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useWallet } from '@/hooks/useWallet'
import { Badge } from '@/components/ui/badge'

export function Navbar() {
  const location = useLocation()
  const { isWalletConnected, isChecking } = useWallet()

  const navLinks = [
    { href: '/', label: 'Verify' },
    { href: '/certificates', label: 'My Certificates' },
  ]

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border bg-white/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-6">
        <Link to="/" className="flex items-center gap-2.5 group">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-white">
            <Shield className="h-4.5 w-4.5" />
          </div>
          <span className="text-lg font-semibold text-text-primary tracking-tight">
            Who I Am
          </span>
        </Link>

        <nav className="flex items-center gap-1">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              to={link.href}
              className={cn(
                'flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                location.pathname === link.href
                  ? 'bg-surface text-primary'
                  : 'text-text-secondary hover:text-text-primary hover:bg-surface'
              )}
            >
              {link.href === '/certificates' && <ScrollText className="h-3.5 w-3.5" />}
              {link.label}
            </Link>
          ))}

          <div className="ml-3 pl-3 border-l border-border">
            {isChecking ? (
              <Badge variant="secondary">Checking...</Badge>
            ) : isWalletConnected ? (
              <Badge variant="success">Wallet Connected</Badge>
            ) : (
              <Badge variant="destructive">No Wallet</Badge>
            )}
          </div>
        </nav>
      </div>
    </header>
  )
}
