import { ShieldCheck } from 'lucide-react'
import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { BackgroundSystem } from './Backgrounds'
import { BrainIllustration } from './BrainIllustration'
import { SkipLink } from './SkipLink'
import { DisclaimerBar } from './DisclaimerBar'
import { Logo } from './Logo'

/** Split layout: form on one side, branded gradient panel with illustration and a short privacy note on the other. */
export function AuthLayout({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string
  subtitle: string
  children: ReactNode
  footer: ReactNode
}) {
  return (
    <div className="flex min-h-screen flex-col">
      <SkipLink />
      <DisclaimerBar />
      <div className="grid flex-1 lg:grid-cols-2">
        <main
          id="main"
          tabIndex={-1}
          className="flex items-center justify-center bg-white px-5 py-12 sm:px-10"
        >
          <div className="w-full max-w-sm">
            <Link to="/" aria-label="NeuroShield AI home">
              <Logo />
            </Link>
            <h1 className="mt-10 text-2xl font-bold text-navy-900">{title}</h1>
            <p className="mt-1 text-sm text-ink-muted">{subtitle}</p>
            <div className="mt-8">{children}</div>
            <p className="mt-6 text-center text-sm text-ink-muted">{footer}</p>
          </div>
        </main>
        <aside
          className="on-dark relative isolate hidden overflow-hidden text-white lg:block"
          aria-label="About privacy"
        >
          <BackgroundSystem tone="dark" />
          <div className="relative flex h-full flex-col items-center justify-center px-12 text-center">
            <BrainIllustration className="w-full max-w-sm drop-shadow-[0_0_40px_rgba(56,208,236,0.35)]" />
            <div className="glass-dark mt-10 max-w-sm rounded-card p-5 text-left text-sm text-navy-50">
              <p className="flex items-center gap-2 font-semibold text-white">
                <ShieldCheck className="h-4 w-4 text-cyan-300" aria-hidden="true" />
                Privacy note
              </p>
              <p className="mt-2">
                Assessments are saved only if you give consent, and you can delete them at any time. Passwords
                are stored as one-way hashes. This is an educational prototype and is not meant for real
                patient data.
              </p>
            </div>
          </div>
        </aside>
      </div>
    </div>
  )
}
