import { Link } from 'react-router-dom'
import { Logo } from './Logo'

export function Footer() {
  return (
    <footer className="on-dark bg-navy-950 text-navy-100">
      <div className="mx-auto grid max-w-6xl gap-10 px-5 py-14 sm:px-8 md:grid-cols-3">
        <div>
          <Logo tone="dark" />
          <p className="mt-4 max-w-xs text-sm text-navy-200">
            An educational tool that estimates whether your stroke risk looks higher or lower, from ten health
            and lifestyle details.
          </p>
        </div>
        <nav aria-label="Footer">
          <h2 className="text-sm font-semibold text-white">Explore</h2>
          <ul className="mt-3 space-y-2 text-sm">
            <li>
              <a className="hover:text-white" href="/#features">
                Features
              </a>
            </li>
            <li>
              <a className="hover:text-white" href="/#how-it-works">
                How it works
              </a>
            </li>
            <li>
              <Link className="hover:text-white" to="/methodology">
                Methodology
              </Link>
            </li>
            <li>
              <Link className="hover:text-white" to="/methodology#data-handling">
                Privacy and data handling
              </Link>
            </li>
          </ul>
        </nav>
        <div>
          <h2 className="text-sm font-semibold text-white">Important</h2>
          <p className="mt-3 text-sm text-navy-200">
            NeuroShield AI is a research-only prototype. It is not a medical device, does not provide a
            diagnosis, and must not be used to decide whether to seek care. If you suspect a stroke, call your
            local emergency number immediately.
          </p>
        </div>
      </div>
      <div className="border-t border-white/10 py-5 text-center text-xs text-navy-300">
        Educational prototype, not medical advice.
      </div>
    </footer>
  )
}
