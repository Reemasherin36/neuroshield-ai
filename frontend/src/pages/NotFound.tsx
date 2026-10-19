import { Link } from 'react-router-dom'
import { NotFoundIllustration } from '../components/NotFoundIllustration'

export default function NotFound() {
  return (
    <div className="mx-auto max-w-md px-5 py-20 text-center">
      <NotFoundIllustration className="mx-auto w-72" />
      <h1 className="mt-6 text-2xl font-bold text-navy-900">Page not found</h1>
      <p className="mt-2 text-ink-muted">The page you are looking for does not exist or has moved.</p>
      <Link to="/" className="btn-primary mt-6">
        Back to home
      </Link>
    </div>
  )
}
