import { useId } from 'react'

/** Original NeuroShield AI mark: a shield containing a small neural network. */
export function LogoMark({ size = 36, className = '' }: { size?: number; className?: string }) {
  const id = useId().replace(/:/g, '')
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      className={className}
      role="img"
      aria-label="NeuroShield AI logo"
    >
      <defs>
        <linearGradient id={`lg-${id}`} x1="6" y1="4" x2="42" y2="44" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#0f766e" />
          <stop offset="1" stopColor="#14b8d8" />
        </linearGradient>
      </defs>
      <path d="M24 3 41 9.5V23c0 11-7.5 19-17 22C14.500 42 7 34 7 23V9.5L24 3Z" fill={`url(#lg-${id})`} />
      <g fill="none" stroke="#ffffff" strokeWidth="1.6" strokeLinecap="round" opacity="0.95">
        <path d="M16.500 19.500 24 14.500l7.500 5M16.500 19.500 24 29M31.500 19.500 24 29M24 14.500V29" />
      </g>
      <g fill="#ffffff">
        <circle cx="24" cy="14.500" r="2.600" />
        <circle cx="16.500" cy="19.500" r="2.300" />
        <circle cx="31.500" cy="19.500" r="2.300" />
        <circle cx="24" cy="29" r="2.600" />
      </g>
    </svg>
  )
}

/** Light and dark lockups: `tone="dark"` is for use on dark backgrounds (white text). */
export function Logo({ tone = 'light', size = 36 }: { tone?: 'light' | 'dark'; size?: number }) {
  return (
    <span className="inline-flex items-center gap-2.5">
      <LogoMark size={size} />
      <span
        className={`text-lg font-bold tracking-tight ${tone === 'dark' ? 'text-white' : 'text-navy-900'}`}
      >
        NeuroShield <span className={tone === 'dark' ? 'text-cyan-300' : 'text-teal-700'}>AI</span>
      </span>
    </span>
  )
}
