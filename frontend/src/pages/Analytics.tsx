import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { NoDataArt } from '../components/EmptyStates'
import { EmergencyNotice } from '../components/EmergencyNotice'
import { FactorSection, useExplanation } from '../components/FactorSection'
import { RiskHeadline } from '../components/RiskHeadline'
import { api, ApiError, type Assessment } from '../lib/api'
import { formatDate, isCategory, riskLevel } from '../lib/format'

function Analysis({ a }: { a: Assessment }) {
  const explanation = useExplanation(a.inputs)
  const data = explanation.kind === 'ready' ? explanation.data : null
  const level = riskLevel(isCategory(a.category) ? a.category : 'lower')
  return (
    <div className="space-y-6">
      <section className="card p-6 sm:p-8" aria-labelledby="result-title">
        <RiskHeadline
          level={data ? riskLevel(data.category) : level}
          probability={data ? data.probability : null}
          threshold={data ? data.threshold : a.threshold}
        />
        <p className="mt-4 text-xs text-ink-subtle">
          From your most recent saved assessment, {formatDate(a.created_at)}.
        </p>
      </section>
      <section className="card p-6" aria-labelledby="drivers-title">
        <h2 id="drivers-title" className="font-semibold text-navy-900">
          What is driving your result
        </h2>
        <div className="mt-3">
          <FactorSection state={explanation} />
        </div>
      </section>
      <EmergencyNotice />
      <div className="flex flex-wrap gap-3">
        <Link to={`/history/${a.id}`} className="btn-secondary">
          Open the full result
        </Link>
        <Link to="/history" className="btn-secondary">
          See older assessments
        </Link>
        <Link to="/assess" className="btn-primary">
          New assessment
        </Link>
      </div>
    </div>
  )
}

/** Personal analysis: higher or lower risk, and which of your own answers drive it. */
export default function Analytics() {
  const [state, setState] = useState<
    | { kind: 'loading' }
    | { kind: 'none' }
    | { kind: 'error'; message: string }
    | { kind: 'ok'; a: Assessment }
  >({ kind: 'loading' })
  useEffect(() => {
    api.assessments
      .list(1, 0)
      .then((p) => setState(p.items.length ? { kind: 'ok', a: p.items[0] } : { kind: 'none' }))
      .catch((e: unknown) =>
        setState({
          kind: 'error',
          message: e instanceof ApiError ? e.message : 'Could not load your analysis.',
        }),
      )
  }, [])

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="text-2xl font-bold text-navy-900">Your risk analysis</h1>
      <p className="mt-1 text-sm text-ink-muted">
        Whether your risk looks higher or lower, and which of your answers push it up or down.
      </p>
      <div className="mt-6">
        {state.kind === 'loading' && (
          <p role="status" className="text-sm text-ink-muted">
            Loading...
          </p>
        )}
        {state.kind === 'error' && (
          <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-status-danger">
            {state.message}
          </p>
        )}
        {state.kind === 'none' && (
          <div className="card p-10 text-center">
            <NoDataArt />
            <h2 className="mt-3 text-lg font-semibold text-navy-900">No analysis yet</h2>
            <p className="mx-auto mt-1 max-w-md text-sm text-ink-muted">
              Complete an assessment and choose &quot;Save and get result&quot; to see your analysis here. You
              always see the same breakdown on the result page, saved or not.
            </p>
            <Link to="/assess" className="btn-primary mt-5">
              Start new assessment
            </Link>
          </div>
        )}
        {state.kind === 'ok' && <Analysis a={state.a} />}
      </div>
    </div>
  )
}
