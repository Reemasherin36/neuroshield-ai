import type { SVGProps } from 'react'

// Custom line icons (24x24, 1.75 stroke) for feature cards. They match the lucide-react style used elsewhere.
const base = (p: SVGProps<SVGSVGElement>) => ({
  width: 24,
  height: 24,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.75,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  'aria-hidden': true,
  ...p,
})

export const HeartPulseIcon = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}>
    <path d="M12 20.500C5 15.500 3 11.500 3 8.800 3 6.200 5 4.500 7.300 4.500c1.900 0 3.600 1.100 4.700 2.800 1.100-1.700 2.800-2.800 4.700-2.800C19 4.500 21 6.200 21 8.800c0 2.700-2 6.700-9 11.700Z" />
    <path d="M7 12h3l1.500-2.500 2 5L15 12h2" />
  </svg>
)
export const GlucoseDropIcon = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}>
    <path d="M12 3S5.500 10.200 5.500 14.500a6.500 6.500 0 0 0 13 0C18.500 10.200 12 3 12 3Z" />
    <path d="M9 15a3 3 0 0 0 3 3" />
  </svg>
)
export const PressureGaugeIcon = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}>
    <path d="M4.500 16a8 8 0 1 1 15 0" />
    <path d="m12 14 3.500-4" />
    <circle cx="12" cy="14" r="1.200" />
    <path d="M7 19.500h10" />
  </svg>
)
export const LifestyleIcon = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}>
    <path d="M12 21v-8" />
    <path d="M12 13c0-4-3-6.500-7-6.500 0 4 2.500 6.500 7 6.500Z" />
    <path d="M12 15.500c0-3.500 2.500-6 7-6 0 4-2.500 6-7 6Z" />
  </svg>
)
export const ShieldNodesIcon = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}>
    <path d="m12 3 7.500 2.800V11c0 4.800-3.100 8.300-7.500 10-4.400-1.700-7.500-5.200-7.500-10V5.800L12 3Z" />
    <path d="m9.500 10 5-.5M9.500 10 12 14.500M14.500 9.500 12 14.500" />
    <circle cx="9.500" cy="10" r="1" fill="currentColor" />
    <circle cx="14.500" cy="9.500" r="1" fill="currentColor" />
    <circle cx="12" cy="14.500" r="1" fill="currentColor" />
  </svg>
)
