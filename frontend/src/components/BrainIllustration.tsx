import { useId } from 'react'

const HEMI = 'M198 58C165 38 112 44 80 78 48 112 40 158 56 192 42 222 56 262 92 276c26 24 76 26 106 4Z'
const GYRI = [
  'M198 100C170 90 140 104 130 128c-10 22 10 38 30 32',
  'M96 110c14-14 32-18 48-14',
  'M70 170c20-10 42 0 48 20 6 20-14 36-32 34',
  'M198 190c-22-12-48 6-42 28 6 20 30 22 42 14',
  'M110 250c20-10 46 0 50 16',
]
// Decorative network overlay (not data): node positions and edges are fixed so the image is deterministic.
const NODES: [number, number][] = [
  [120, 112],
  [160, 150],
  [96, 192],
  [150, 218],
  [130, 256],
  [276, 112],
  [236, 150],
  [300, 192],
  [246, 218],
  [266, 256],
  [198, 168],
  [198, 232],
]
const EDGES: [number, number][] = [
  [0, 1],
  [1, 2],
  [1, 3],
  [2, 3],
  [3, 4],
  [1, 10],
  [3, 11],
  [10, 11],
  [10, 6],
  [11, 8],
  [5, 6],
  [6, 7],
  [6, 8],
  [7, 8],
  [8, 9],
]

/** Original layered-SVG brain: two hemispheres, soft glow, thin neural-network lines and nodes. */
export function BrainIllustration({
  className = '',
  title = 'Stylised illustration of a brain with a neural network overlay',
}: {
  className?: string
  title?: string
}) {
  const id = useId().replace(/:/g, '')
  return (
    <svg viewBox="0 0 396 340" className={className} role="img" aria-label={title}>
      <defs>
        <linearGradient id={`h-${id}`} x1="60" y1="50" x2="198" y2="290" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#38d0ec" stopOpacity="0.9" />
          <stop offset="0.55" stopColor="#139d93" stopOpacity="0.85" />
          <stop offset="1" stopColor="#0b2545" stopOpacity="0.95" />
        </linearGradient>
        <filter id={`glow-${id}`} x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="9" />
        </filter>
        <path id={`hemi-${id}`} d={HEMI} />
      </defs>

      {/* glow layer */}
      <g filter={`url(#glow-${id})`} opacity="0.55" fill="#38d0ec">
        <use href={`#hemi-${id}`} />
        <use href={`#hemi-${id}`} transform="translate(396 0) scale(-1 1)" />
      </g>
      {/* brain stem */}
      <path d="M178 274c0 22 5 40 12 58q8 6 16 0c7-18 12-36 12-58Z" fill="#0f5d63" opacity="0.9" />
      {/* hemispheres */}
      {[false, true].map((mirror) => (
        <g key={String(mirror)} transform={mirror ? 'translate(396 0) scale(-1 1)' : undefined}>
          <use
            href={`#hemi-${id}`}
            fill={`url(#h-${id})`}
            stroke="#bff3fb"
            strokeOpacity="0.55"
            strokeWidth="1.5"
          />
          <g fill="none" stroke="#bff3fb" strokeOpacity="0.45" strokeWidth="1.6" strokeLinecap="round">
            {GYRI.map((d) => (
              <path key={d} d={d} />
            ))}
          </g>
        </g>
      ))}
      {/* neural network overlay */}
      <g stroke="#e6fbff" strokeOpacity="0.55" strokeWidth="1">
        {EDGES.map(([a, b]) => (
          <line key={`${a}-${b}`} x1={NODES[a][0]} y1={NODES[a][1]} x2={NODES[b][0]} y2={NODES[b][1]} />
        ))}
      </g>
      <g fill="#ffffff">
        {NODES.map(([x, y], i) => (
          <circle
            key={i}
            cx={x}
            cy={y}
            r={i % 3 === 0 ? 4.5 : 3.2}
            className={i % 2 === 0 ? 'motion-safe:animate-pulse-node' : ''}
          />
        ))}
      </g>
    </svg>
  )
}
