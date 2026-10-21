import { RISK_LABEL, formatPercent, type RiskLevel } from '../lib/format'
import { RiskScale } from './RiskBand'

/** The one thing a person needs first: is the risk higher or lower, and what is the percentage. */
export function RiskHeadline({
  level,
  probability,
  threshold,
}: {
  level: RiskLevel
  probability: number | null
  threshold: number
}) {
  const higher = level === 'higher'
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wide text-teal-700">Your result</p>
      <h1
        id="result-title"
        className={`mt-1 text-3xl font-extrabold sm:text-4xl ${higher ? 'text-navy-700' : 'text-teal-800'}`}
      >
        {RISK_LABEL[level]}
      </h1>
      {probability !== null && (
        <p className="mt-3 text-lg text-ink">
          Estimated stroke risk:{' '}
          <strong className="text-2xl text-navy-900">{formatPercent(probability)}</strong>
        </p>
      )}
      <div className="mt-6">
        <RiskScale level={level} />
      </div>
      <p className="mt-6 text-ink">
        {probability !== null ? (
          <>
            This tool treats <strong>{formatPercent(threshold)}</strong> or more as higher risk. Your estimate
            is {higher ? 'at or above' : 'below'} that level.{' '}
          </>
        ) : null}
        {higher
          ? 'People with answers like yours were more often recorded as having a stroke in the data this tool learned from. This is not a diagnosis. Please talk to a doctor about your risk factors.'
          : 'People with answers like yours were less often recorded as having a stroke in the data this tool learned from. Lower does not mean no risk, and this is not a diagnosis. If you have any warning signs, get medical help.'}
      </p>
    </div>
  )
}
