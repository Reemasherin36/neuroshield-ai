import { Menu, X } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../lib/auth'
import { Logo } from './Logo'

const LINKS = [
  { href: '/#features', label: 'Features' },
  { href: '/#how-it-works', label: 'How it works' },
  { href: '/methodology', label: 'Methodology' },
  { href: '/#faq', label: 'FAQ' },
]

/** Sticky glass navbar, responsive with a keyboard-accessible mobile menu. */
export function Navbar() {
  const [open, setOpen] = useState(false)
  const { user } = useAuth()
  return (
    <header className="sticky top-0 z-40 border-b border-white/40 bg-white/80 backdrop-blur-lg">
      <nav
        aria-label="Main"
        className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5 sm:px-8"
      >
        <Link to="/" aria-label="NeuroShield AI home">
          <Logo />
        </Link>
        <ul className="hidden items-center gap-7 md:flex">
          {LINKS.map((l) => (
            <li key={l.href}>
              <a href={l.href} className="text-sm font-medium text-ink-muted hover:text-navy-900">
                {l.label}
              </a>
            </li>
          ))}
        </ul>
        <div className="hidden items-center gap-3 md:flex">
          {user ? (
            <Link to="/dashboard" className="btn-primary">
              Open dashboard
            </Link>
          ) : (
            <>
              <Link to="/login" className="btn-secondary">
                Sign in
              </Link>
              <Link to="/register" className="btn-primary">
                Get started
              </Link>
            </>
          )}
        </div>
        <button
          className="rounded-lg p-2 text-navy-900 md:hidden"
          aria-expanded={open}
          aria-controls="mobile-menu"
          aria-label={open ? 'Close menu' : 'Open menu'}
          onClick={() => setOpen((v) => !v)}
        >
          {open ? <X /> : <Menu />}
        </button>
      </nav>
      {open && (
        <div id="mobile-menu" className="border-t border-surface-line bg-white px-5 pb-5 pt-3 md:hidden">
          <ul className="space-y-1">
            {LINKS.map((l) => (
              <li key={l.href}>
                <a
                  href={l.href}
                  onClick={() => setOpen(false)}
                  className="block rounded-lg px-2 py-2.5 text-sm font-medium text-navy-900 hover:bg-navy-50"
                >
                  {l.label}
                </a>
              </li>
            ))}
          </ul>
          <div className="mt-4 flex gap-3">
            {user ? (
              <Link to="/dashboard" className="btn-primary flex-1">
                Open dashboard
              </Link>
            ) : (
              <>
                <Link to="/login" className="btn-secondary flex-1">
                  Sign in
                </Link>
                <Link to="/register" className="btn-primary flex-1">
                  Get started
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  )
}
