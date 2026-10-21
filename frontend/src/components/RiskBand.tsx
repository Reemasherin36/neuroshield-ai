import { RISK_LABEL, type RiskLevel } from '../lib/format'

/** Two-state scale. It shows which side of the model's threshold the result falls on. */
export function RiskScale({ level }: { level: RiskLevel }) {
  const seg = (key: RiskLevel, base: string) => (
    <div className="text-center">
      <div
        className={`h-3 rounded-pill ${base} ${key === level ? 'ring-2 ring-navy-900 ring-offset-2' : 'opacity-40'}`}
      />
      <div
        className={`mx-auto mt-2 h-0 w-0 border-x-[6px] border-b-[8px] border-x-transparent ${key === level ? 'border-b-navy-900' : 'border-b-transparent'}`}
      />
      <p className={`mt-1 text-sm ${key === level ? 'font-semibold text-navy-900' : 'text-ink-subtle'}`}>
        {RISK_LABEL[key]}
      </p>
    </div>
  )
  return (
    <div role="img" aria-label={`Result: ${RISK_LABEL[level]}`}>
      <div className="grid grid-cols-2 gap-1.5">
        {seg('lower', 'bg-teal-300')}
        {seg('higher', 'bg-navy-500')}
      </div>
    </div>
  )
}
