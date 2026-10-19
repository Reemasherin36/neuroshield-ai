import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ConfirmButton } from '../components/ConfirmButton'
import { ResultView, type ResultData } from '../components/ResultView'
import { ApiError, api } from '../lib/api'
import { isCategory } from '../lib/format'

export default function HistoryDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [state, setState] = useState<
    | { kind: 'loading' }
    | { kind: 'missing' }
    | { kind: 'error'; message: string }
    | { kind: 'ok'; data: ResultData }
  >({ kind: 'loading' })

  useEffect(() => {
    const n = Number(id)
    if (!Number.isInteger(n)) return setState({ kind: 'missing' })
    Promise.all([
      api.assessments.get(n),
      api.model
        .metrics()
        .then((m) => m.probability_display_supported)
        .catch(() => false),
    ])
      .then(([a, supported]) => {
        if (!isCategory(a.category)) throw new Error('Unknown category')
        setState({
          kind: 'ok',
          data: {
            category: a.category,
            probability: supported ? a.score : null,
            inputs: a.inputs,
            threshold: a.threshold,
            modelVersion: a.model_version,
            saved: true,
          },
        })
      })
      .catch((e: unknown) =>
        setState(
          e instanceof ApiError && e.status === 404
            ? { kind: 'missing' }
            : {
                kind: 'error',
                message: e instanceof ApiError ? e.message : 'Could not load this assessment.',
              },
        ),
      )
  }, [id])

  if (state.kind === 'loading')
    return (
      <p role="status" className="text-sm text-ink-muted">
        Loading...
      </p>
    )
  if (state.kind === 'missing')
    return (
      <div className="mx-auto max-w-md text-center">
        <h1 className="text-xl font-bold text-navy-900">Assessment not found</h1>
        <p className="mt-2 text-sm text-ink-muted">It may have been deleted.</p>
        <Link to="/history" className="btn-primary mt-5">
          Back to history
        </Link>
      </div>
    )
  if (state.kind === 'error')
    return (
      <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-status-danger">
        {state.message}
      </p>
    )
  return (
    <ResultView
      data={state.data}
      extra={
        <ConfirmButton
          label="Delete this assessment"
          confirmLabel="Confirm delete"
          onConfirm={async () => {
            await api.assessments.remove(Number(id))
            navigate('/history', { replace: true })
          }}
        />
      }
    />
  )
}
