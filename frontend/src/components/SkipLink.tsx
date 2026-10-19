/** First focusable element on every page: lets keyboard and screen-reader users bypass the navigation. */
export function SkipLink() {
  return (
    <a
      href="#main"
      onClick={(e) => {
        e.preventDefault()
        const main = document.getElementById('main')
        main?.focus()
        main?.scrollIntoView?.()
      }}
      className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-50 focus:rounded-lg focus:bg-white focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-navy-900 focus:shadow-card"
    >
      Skip to main content
    </a>
  )
}
