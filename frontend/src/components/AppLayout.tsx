import { BarChart3, ClipboardList, History, LayoutDashboard, LogOut, Settings } from 'lucide-react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../lib/auth'
import { SkipLink } from './SkipLink'
import { DisclaimerBar } from './DisclaimerBar'
import { Logo } from './Logo'

const NAV = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/assess', label: 'New assessment', icon: ClipboardList },
  { to: '/history', label: 'History', icon: History },
  { to: '/analytics', label: 'Analytics', icon: BarChart3 },
  { to: '/settings', label: 'Settings', icon: Settings },
]

/** Private app shell: sidebar (desktop) or scrollable tab row (mobile) plus a top bar. */
export function AppLayout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const link = ({ isActive }: { isActive: boolean }) =>
    `flex items-center gap-2.5 whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium ${isActive ? 'bg-teal-50 text-teal-800' : 'text-ink-muted hover:bg-navy-50 hover:text-navy-900'}`
  return (
    <div className="flex min-h-screen flex-col">
      <SkipLink />
      <DisclaimerBar />
      <div className="flex flex-1">
        <aside className="hidden w-60 shrink-0 border-r border-surface-line bg-white p-4 lg:block">
          <div className="px-2 py-2">
            <Logo />
          </div>
          <nav aria-label="Application sections" className="mt-6 space-y-1">
            {NAV.map((n) => (
              <NavLink key={n.to} to={n.to} className={link}>
                <n.icon className="h-4 w-4" aria-hidden="true" />
                {n.label}
              </NavLink>
            ))}
          </nav>
        </aside>
        <div className="flex min-w-0 flex-1 flex-col">
          <header className="flex h-14 items-center justify-between border-b border-surface-line bg-white px-4 sm:px-6">
            <span className="lg:hidden">
              <Logo size={28} />
            </span>
            <span className="hidden text-sm text-ink-muted lg:block">
              Signed in as <strong className="text-navy-900">{user?.email}</strong>
            </span>
            <button
              className="btn-secondary !py-1.5"
              onClick={async () => {
                await logout()
                navigate('/', { replace: true })
              }}
            >
              <LogOut className="h-4 w-4" aria-hidden="true" /> Sign out
            </button>
          </header>
          <nav
            aria-label="App"
            className="flex gap-1 overflow-x-auto border-b border-surface-line bg-white px-3 py-2 lg:hidden"
          >
            {NAV.map((n) => (
              <NavLink key={n.to} to={n.to} className={link}>
                <n.icon className="h-4 w-4" aria-hidden="true" />
                {n.label}
              </NavLink>
            ))}
          </nav>
          <main id="main" tabIndex={-1} className="flex-1 p-4 sm:p-8">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  )
}
