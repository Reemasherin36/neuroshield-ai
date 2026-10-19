import { ClipboardList, History as HistoryIcon, ShieldCheck } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Bar, BarChart, Cell, ResponsiveContainer, Tooltip, XAxis } from 'recharts'
import { Link } from 'react-router-dom'
import { ModelNotTrainedArt, NoAssessmentsArt } from '../components/EmptyStates'
import { api, type Assessment } from '../lib/api'
import { useAuth } from '../lib/auth'
import { CHART } from '../lib/chartTheme'
import { CATEGORY_LEVEL, CATEGORY_SHORT, formatDate, isCategory, type Category } from '../lib/format'

type Data = { items: Assessment[]; total: number }
const COLORS: Record<Category, string> = { lower: '#5ad6c8', moderate: '#38d0ec', higher: '#3c629a' }

function StatCard({
  icon: Icon,
  label,
  value,
  sub,
}: {
  icon: typeof ShieldCheck
  label: string
  value: string
  sub?: string
}) {
  return (
    <div className="card relative overflow-hidden p-5">
      <div aria-hidden="true" className="absolute inset-x-0 top-0 h-1 bg-accent-gradient" />
      <Icon className="h-5 w-5 text-teal-700" aria-hidden="true" />
      <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-ink-subtle">{label}</p>
      <p className="mt-1 text-2xl font-bold text-navy-900">{value}</p>
      {sub && <p className="mt-0.5 text-xs text-ink-muted">{sub}</p>}
    </div>
  )
}

export default function Dashboard() {
  const { user } = useAuth()
  const [data, setData] = useState<Data | 'error' | null>(null)
  const [model, setModel] = useState<{ loaded: boolean; message: string | null } | 'offline' | null>(null)

  useEffect(() => {
    api.assessments
      .list(100, 0)
      .then((p) => setData({ items: p.items, total: p.total }))
      .catch(() => setData('error'))
    api
      .health()
      .then((h) => setModel({ loaded: h.model_loaded, message: h.model_message }))
      .catch(() => setModel('offline'))
  }, [])

  const items = data && data !== 'error' ? data.items : []
  const counts: Record<Category, number> = { lower: 0, moderate: 0, higher: 0 }
  items.forEach((a) => {
    if (isCategory(a.category)) counts[a.category] += 1
  })
  const spark = [...items]
    .slice(0, 10)
    .reverse()
    .map((a, i) => ({
      n: i + 1,
      date: formatDate(a.created_at),
      category: a.category,
      level: isCategory(a.category) ? CATEGORY_LEVEL[a.category] : 0,
    }))
  const modelMissing = model !== null && model !== 'offline' && !model.loaded

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-navy-900">Welcome</h1>
          <p className="text-sm text-ink-muted">{user?.email}</p>
        </div>
        <Link to="/assess" className="btn-primary">
          <ClipboardList className="h-4 w-4" aria-hidden="true" />
          Start new assessment
        </Link>
      </header>

      {modelMissing && (
        <div className="card flex items-center gap-4 p-5" role="status">
          <ModelNotTrainedArt className="hidden h-20 w-auto sm:block" />
          <div>
            <p className="font-semibold text-navy-900">Model not trained yet</p>
            <p className="text-sm text-ink-muted">
              {model.message ?? 'The backend has no trained model.'} Run <code>.\scripts\train.ps1</code> and
              restart the backend.
            </p>
          </div>
        </div>
      )}
      {model === 'offline' && (
        <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-status-danger">
          The backend could not be reached.
        </p>
      )}

      {data === null && (
        <p role="status" className="text-sm text-ink-muted">
          Loading your assessments...
        </p>
      )}
      {data === 'error' && (
        <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-status-danger">
          Could not load your assessments.
        </p>
      )}

      {data && data !== 'error' && (
        <>
          <div className="grid gap-4 sm:grid-cols-3">
            <StatCard icon={HistoryIcon} label="Saved assessments" value={String(data.total)} />
            <StatCard
              icon={ClipboardList}
              label="Most recent"
              value={items[0] ? formatDate(items[0].created_at) : 'None yet'}
            />
            <StatCard
              icon={ShieldCheck}
              label="Model"
              value={model && model !== 'offline' ? (model.loaded ? 'Loaded' : 'Not trained') : '...'}
            />
          </div>

          {data.total === 0 ? (
            <div className="card p-10 text-center">
              <NoAssessmentsArt />
              <h2 className="mt-3 text-lg font-semibold text-navy-900">No saved assessments yet</h2>
              <p className="mx-auto mt-1 max-w-md text-sm text-ink-muted">
                Results appear here only when you choose to save them. Nothing on this page is sample data.
              </p>
              <Link to="/assess" className="btn-primary mt-5">
                Start new assessment
              </Link>
            </div>
          ) : (
            <>
              <div className="grid gap-4 lg:grid-cols-2">
                <section className="card p-6" aria-labelledby="dist-title">
                  <h2 id="dist-title" className="font-semibold text-navy-900">
                    Your saved results by band
                  </h2>
                  <div
                    className="mt-4 flex h-4 overflow-hidden rounded-pill bg-navy-50"
                    role="img"
                    aria-label={`Lower ${counts.lower}, moderate ${counts.moderate}, higher ${counts.higher}`}
                  >
                    {(Object.keys(counts) as Category[]).map(
                      (c) =>
                        counts[c] > 0 && (
                          <div
                            key={c}
                            style={{
                              width: `${(counts[c] / items.length) * 100}%`,
                              backgroundColor: COLORS[c],
                            }}
                          />
                        ),
                    )}
                  </div>
                  <ul className="mt-4 grid grid-cols-3 gap-2 text-sm">
                    {(Object.keys(counts) as Category[]).map((c) => (
                      <li key={c}>
                        <span
                          className="mr-1.5 inline-block h-2.5 w-2.5 rounded-full"
                          style={{ backgroundColor: COLORS[c] }}
                          aria-hidden="true"
                        />
                        {CATEGORY_SHORT[c]}: <strong>{counts[c]}</strong>
                      </li>
                    ))}
                  </ul>
                  {data.total > items.length && (
                    <p className="mt-3 text-xs text-ink-subtle">
                      Based on your latest {items.length} of {data.total} assessments.
                    </p>
                  )}
                </section>
                <section className="card p-6" aria-labelledby="trend-title">
                  <h2 id="trend-title" className="font-semibold text-navy-900">
                    Recent bands over time
                  </h2>
                  <div className="mt-2 h-28">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={spark} margin={{ top: 4, right: 4, bottom: 0, left: 4 }}>
                        <XAxis dataKey="n" hide />
                        <Tooltip
                          contentStyle={CHART.tooltip}
                          formatter={(_v, _n, p) => [
                            CATEGORY_SHORT[p.payload.category as Category] ?? '',
                            'Band',
                          ]}
                          labelFormatter={(_l, p) => p?.[0]?.payload?.date ?? ''}
                        />
                        <Bar dataKey="level" radius={[6, 6, 0, 0]}>
                          {spark.map((s) => (
                            <Cell
                              key={s.n}
                              fill={isCategory(s.category) ? COLORS[s.category] : CHART.muted}
                            />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                  <p className="text-xs text-ink-subtle">
                    Oldest to newest, up to 10. Taller bar means a higher band.
                  </p>
                </section>
              </div>

              <section className="card p-6" aria-labelledby="recent-title">
                <div className="flex items-center justify-between">
                  <h2 id="recent-title" className="font-semibold text-navy-900">
                    Recent history
                  </h2>
                  <Link to="/history" className="text-sm font-medium text-teal-700 underline">
                    View all
                  </Link>
                </div>
                <ul className="mt-3 divide-y divide-surface-line">
                  {items.slice(0, 5).map((a) => (
                    <li key={a.id} className="flex items-center justify-between gap-3 py-3 text-sm">
                      <span className="text-ink-muted">{formatDate(a.created_at)}</span>
                      <span className="font-medium text-navy-900">
                        {isCategory(a.category) ? CATEGORY_SHORT[a.category] : a.category}
                      </span>
                      <Link to={`/history/${a.id}`} className="text-teal-700 underline">
                        View
                      </Link>
                    </li>
                  ))}
                </ul>
              </section>
            </>
          )}
        </>
      )}
    </div>
  )
}
