import { useEffect, useState } from 'react'
import {
  Bar,
  BarChart,
  Cell,
  CartesianGrid,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { api, ApiError, type AssessmentInput, type Explanation } from '../lib/api'
import { CHART } from '../lib/chartTheme'
import { FEATURE_LABEL, describeValue } from '../lib/format'

export type ExplainState =
  { kind: 'loading' } | { kind: 'error'; message: string } | { kind: 'ready'; data: Explanation }

/** Fetches the per-answer effects for these inputs. Stateless on the server: nothing is stored. */
export function useExplanation(inputs: AssessmentInput): ExplainState {
  const [state, setState] = useState<ExplainState>({ kind: 'loading' })
  useEffect(() => {
    let cancelled = false
    api
      .explain(inputs)
      .then((data) => !cancelled && setState({ kind: 'ready', data }))
      .catch(
        (e: unknown) =>
          !cancelled &&
          setState({
            kind: 'error',
            message: e instanceof ApiError ? e.message : 'Could not load the breakdown.',
          }),
      )
    return () => {
      cancelled = true
    }
  }, [inputs])
  return state
}

const NOTABLE = 0.005 // half a percentage point
const pts = (effect: number) => `${effect >= 0 ? '+' : '-'}${Math.abs(effect * 100).toFixed(1)} points`

/** Which of the person's own answers push the estimate up or down, compared with a typical person. */
export function FactorSection({ state }: { state: ExplainState }) {
  if (state.kind === 'loading')
    return (
      <p role="status" className="text-sm text-ink-muted">
        Working out what is driving your result...
      </p>
    )
  if (state.kind === 'error')
    return (
      <p role="alert" className="rounded-lg bg-navy-50 p-3 text-sm text-ink">
        {state.message}
      </p>
    )

  const { factors } = state.data
  const up = factors.filter((f) => f.effect >= NOTABLE)
  const down = factors.filter((f) => f.effect <= -NOTABLE)
  const little = factors.filter((f) => Math.abs(f.effect) < NOTABLE)
  const data = factors
    .filter((f) => Math.abs(f.effect) >= 0.0005)
    .map((f) => ({
      name: FEATURE_LABEL[f.feature] ?? f.feature,
      points: Number((f.effect * 100).toFixed(2)),
    }))

  const row = (f: (typeof factors)[number]) => (
    <li
      key={f.feature}
      className="flex flex-wrap justify-between gap-x-4 border-b border-surface-line py-2 text-sm"
    >
      <span>
        <strong className="text-navy-900">{FEATURE_LABEL[f.feature] ?? f.feature}</strong>{' '}
        <span className="text-ink-muted">({describeValue(f.feature, f.value)})</span>
      </span>
      <span className="font-semibold text-navy-900">{pts(f.effect)}</span>
    </li>
  )

  return (
    <div>
      <p className="text-sm text-ink-muted">
        Compared with a typical person in the data (about age{' '}
        {describeValue('age', factors.find((f) => f.feature === 'age')?.typical ?? 45)}, no high blood
        pressure or heart disease, never smoked), this is how much each of your answers changes your estimated
        risk. "Points" are percentage points.
      </p>

      {data.length === 0 ? (
        <p className="mt-4 rounded-lg bg-navy-50 p-4 text-sm text-ink">
          Your answers are very close to the typical person&apos;s, so no single answer stands out.
        </p>
      ) : (
        <figure className="mt-4">
          <div className="h-72" aria-hidden="true">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data} layout="vertical" margin={{ top: 4, right: 16, bottom: 18, left: 8 }}>
                <CartesianGrid stroke={CHART.grid} horizontal={false} />
                <XAxis
                  type="number"
                  tickFormatter={(v: number) => `${v > 0 ? '+' : ''}${v}`}
                  stroke={CHART.axis}
                  fontSize={12}
                  label={{
                    value: 'Change in estimated risk (percentage points)',
                    position: 'insideBottom',
                    offset: -10,
                    fontSize: 12,
                  }}
                />
                <YAxis type="category" dataKey="name" width={130} stroke={CHART.axis} fontSize={12} />
                <Tooltip
                  contentStyle={CHART.tooltip}
                  formatter={(v) => [`${Number(v) > 0 ? '+' : ''}${v} points`, 'Effect']}
                />
                <ReferenceLine x={0} stroke={CHART.axis} />
                <Bar dataKey="points" radius={[0, 6, 6, 0]}>
                  {data.map((d) => (
                    <Cell key={d.name} fill={d.points > 0 ? '#3c629a' : '#2dbbae'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <figcaption className="mt-1 text-xs text-ink-subtle">
            Bars to the right push your estimate up. Bars to the left push it down. The lists below give the
            same information as text.
          </figcaption>
        </figure>
      )}

      {up.length > 0 && (
        <div className="mt-5">
          <h3 className="font-semibold text-navy-900">Pushing your estimate up</h3>
          <ul className="mt-1">{up.map(row)}</ul>
        </div>
      )}
      {down.length > 0 && (
        <div className="mt-5">
          <h3 className="font-semibold text-navy-900">Pushing your estimate down</h3>
          <ul className="mt-1">{down.map(row)}</ul>
          <p className="mt-2 text-xs text-ink-subtle">
            The tool learned these patterns from one dataset. Something shown here as lowering the estimate (a
            higher BMI, for example) can still be a recognised risk factor, so do not read it as protective.
          </p>
        </div>
      )}
      {little.length > 0 && (
        <p className="mt-5 text-sm text-ink-muted">
          <strong className="text-navy-900">Little or no effect:</strong>{' '}
          {little.map((f) => FEATURE_LABEL[f.feature] ?? f.feature).join(', ')}.
        </p>
      )}
      <p className="mt-4 text-xs text-ink-subtle">
        Each answer is swapped, one at a time, for the typical value, so effects overlap and do not add up
        exactly. This describes patterns in the data, not what caused anyone&apos;s stroke, and it is not
        medical advice.
      </p>
    </div>
  )
}
