/** Original 404 scene: a dotted path that ends before reaching a shield. */
export function NotFoundIllustration({ className = '' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 320 200"
      className={className}
      role="img"
      aria-label="Illustration of a dotted path that does not reach its destination"
    >
      <rect x="0" y="150" width="320" height="2" fill="#dde6f3" />
      <path
        d="M20 140C70 140 80 80 130 80s60 40 100 20"
        fill="none"
        stroke="#2dbbae"
        strokeWidth="3"
        strokeDasharray="2 9"
        strokeLinecap="round"
      />
      <circle cx="20" cy="140" r="6" fill="#0b2545" />
      <path
        d="M262 60l30 11v20c0 18-12 32-30 38-18-6-30-20-30-38V71l30-11Z"
        fill="#dde6f3"
        stroke="#8aa6cf"
        strokeWidth="2"
      />
      <text x="262" y="100" textAnchor="middle" fontSize="20" fontWeight="700" fill="#223a61">
        404
      </text>
    </svg>
  )
}
