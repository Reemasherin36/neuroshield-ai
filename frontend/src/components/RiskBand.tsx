import { CATEGORY_SHORT, type Category } from '../lib/format'

const SEGMENTS: { key: Category; bg: string }[] = [
  { key: 'lower', bg: 'bg-teal-200' },
  { key: 'moderate', bg: 'bg-cyan-300' },
  { key: 'higher', bg: 'bg-navy-500' },
]

/** Calm, non-alarming segmented band. It shows where the output sits relative to the training data, not a gauge. */
export function RiskBand({ category }: { category: Category }) {
  return (
    <div
      role="img"
      aria-label={`Model output band: ${CATEGORY_SHORT[category]} than typical in the training data`}
    >
      <div className="grid grid-cols-3 gap-1.5">
        {SEGMENTS.map((s) => (
          <div key={s.key} className="text-center">
            <div
              className={`h-3 rounded-pill ${s.bg} ${s.key === category ? 'ring-2 ring-navy-900 ring-offset-2' : 'opacity-50'}`}
            />
            <div
              className={`mt-2 h-0 w-0 border-x-[6px] border-b-[8px] border-x-transparent mx-auto ${s.key === category ? 'border-b-navy-900' : 'border-b-transparent'}`}
            />
            <p
              className={`mt-1 text-sm ${s.key === category ? 'font-semibold text-navy-900' : 'text-ink-subtle'}`}
            >
              {CATEGORY_SHORT[s.key]}
            </p>
          </div>
        ))}
      </div>
      <p className="mt-1 text-center text-xs text-ink-muted">
        lower / moderate / higher than typical in the training data
      </p>
    </div>
  )
}
