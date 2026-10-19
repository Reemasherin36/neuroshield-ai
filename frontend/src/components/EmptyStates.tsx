/** Small original SVG scenes for empty states. Decorative only. */
const wrap = 'mx-auto h-28 w-auto'

export function NoAssessmentsArt({ className = wrap }: { className?: string }) {
  return (
    <svg viewBox="0 0 200 120" className={className} aria-hidden="true">
      <rect x="45" y="18" width="110" height="84" rx="10" fill="#f1f5fb" stroke="#b9cbe5" strokeWidth="2" />
      <rect x="60" y="36" width="50" height="6" rx="3" fill="#b9cbe5" />
      <rect x="60" y="52" width="80" height="6" rx="3" fill="#dde6f3" />
      <rect x="60" y="68" width="65" height="6" rx="3" fill="#dde6f3" />
      <circle cx="146" cy="88" r="16" fill="#0f766e" />
      <path d="M146 80v16M138 88h16" stroke="#fff" strokeWidth="3" strokeLinecap="round" />
    </svg>
  )
}

export function ModelNotTrainedArt({ className = wrap }: { className?: string }) {
  return (
    <svg viewBox="0 0 200 120" className={className} aria-hidden="true">
      <circle cx="100" cy="60" r="38" fill="#f1f5fb" stroke="#b9cbe5" strokeWidth="2" strokeDasharray="5 6" />
      <g stroke="#8aa6cf" strokeWidth="2" strokeLinecap="round">
        <path d="M82 52 100 42l18 10M82 52l18 20M118 52 100 72M100 42v30" fill="none" />
      </g>
      <g fill="#8aa6cf">
        <circle cx="100" cy="42" r="5" />
        <circle cx="82" cy="52" r="4.500" />
        <circle cx="118" cy="52" r="4.500" />
        <circle cx="100" cy="72" r="5" />
      </g>
    </svg>
  )
}

export function NoDataArt({ className = wrap }: { className?: string }) {
  return (
    <svg viewBox="0 0 200 120" className={className} aria-hidden="true">
      <path d="M30 100h140" stroke="#b9cbe5" strokeWidth="2" strokeLinecap="round" />
      <rect x="52" y="70" width="20" height="30" rx="4" fill="#dde6f3" />
      <rect x="90" y="50" width="20" height="50" rx="4" fill="#dde6f3" />
      <rect x="128" y="62" width="20" height="38" rx="4" fill="#dde6f3" />
      <path
        d="M52 56c24-4 40-30 96-26"
        stroke="#2dbbae"
        strokeWidth="2.500"
        strokeDasharray="2 7"
        strokeLinecap="round"
        fill="none"
      />
    </svg>
  )
}
