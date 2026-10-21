import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ConfirmButton } from '../components/ConfirmButton'
import { NoAssessmentsArt } from '../components/EmptyStates'
import { errorText } from '../components/StateNotice'
import { api, type AssessmentPage } from '../lib/api'
import { RISK_LABEL, formatDate, isCategory, riskLevel } from '../lib/format'

const PAGE = 10

export default function History() {
  const [offset, setOffset] = useState(0)
  const [page, setPage] = useState<AssessmentPage | null>(null)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async (o: number) => {
    try {
      const p = await api.assessments.list(PAGE, o)
      if (p.items.length === 0 && o > 0) return setOffset(Math.max(0, o - PAGE)) // last item of a page was deleted
      setPage(p)
      setError(null)
    } catch (e) {
      setError(errorText(e))
    }
  }, [])
  useEffect(() => {
    void load(offset)
  }, [load, offset])

  const remove = async (id: number) => {
    try {
      await api.assessments.remove(id)
      await load(offset)
    } catch (e) {
      setError(errorText(e))
    }
  }
  const removeAll = async () => {
    try {
      await api.assessments.removeAll()
      setOffset(0)
      await load(0)
    } catch (e) {
      setError(errorText(e))
    }
  }

  return (
    <div className="mx-auto max-w-4xl">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-navy-900">History</h1>
          <p className="text-sm text-ink-muted">
            Only results you chose to save appear here, and only you can see them.
          </p>
        </div>
        {page && page.total > 0 && (
          <ConfirmButton
            label="Delete all"
            confirmLabel="Yes, delete all my saved assessments"
            onConfirm={removeAll}
          />
        )}
      </header>
      {error && (
        <p role="alert" className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-status-danger">
          {error}
        </p>
      )}
      {!page && !error && (
        <p role="status" className="mt-6 text-sm text-ink-muted">
          Loading...
        </p>
      )}
      {page && page.total === 0 && (
        <div className="card mt-6 p-10 text-center">
          <NoAssessmentsArt />
          <h2 className="mt-3 text-lg font-semibold text-navy-900">No saved assessments</h2>
          <p className="mt-1 text-sm text-ink-muted">
            Tick the consent box when you submit an assessment to keep it here.
          </p>
          <Link to="/assess" className="btn-primary mt-5">
            Start new assessment
          </Link>
        </div>
      )}
      {page && page.total > 0 && (
        <>
          <ul className="card mt-6 divide-y divide-surface-line">
            {page.items.map((a) => (
              <li key={a.id} className="flex flex-wrap items-center justify-between gap-3 p-4 text-sm">
                <div>
                  <p className="font-medium text-navy-900">
                    {isCategory(a.category) ? RISK_LABEL[riskLevel(a.category)] : a.category}
                  </p>
                  <p className="text-xs text-ink-subtle">
                    {formatDate(a.created_at)} · model {a.model_version}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <Link to={`/history/${a.id}`} className="btn-secondary !py-1.5">
                    View
                  </Link>
                  <ConfirmButton
                    label="Delete"
                    confirmLabel="Confirm delete"
                    className="btn-secondary !py-1.5"
                    onConfirm={() => remove(a.id)}
                  />
                </div>
              </li>
            ))}
          </ul>
          <nav
            aria-label="Pagination"
            className="mt-4 flex items-center justify-between text-sm text-ink-muted"
          >
            <span>
              {offset + 1}-{Math.min(offset + PAGE, page.total)} of {page.total}
            </span>
            <span className="flex gap-2">
              <button
                className="btn-secondary !py-1.5"
                disabled={offset === 0}
                onClick={() => setOffset(Math.max(0, offset - PAGE))}
              >
                Previous
              </button>
              <button
                className="btn-secondary !py-1.5"
                disabled={offset + PAGE >= page.total}
                onClick={() => setOffset(offset + PAGE)}
              >
                Next
              </button>
            </span>
          </nav>
        </>
      )}
    </div>
  )
}
