import { Outlet } from 'react-router-dom'
import { SkipLink } from './SkipLink'
import { DisclaimerBar } from './DisclaimerBar'
import { Footer } from './Footer'
import { Navbar } from './Navbar'

export function PublicLayout() {
  return (
    <div className="flex min-h-screen flex-col">
      <SkipLink />
      <DisclaimerBar />
      <Navbar />
      <main id="main" tabIndex={-1} className="flex-1">
        <Outlet />
      </main>
      <Footer />
    </div>
  )
}
