import { useEffect, useState, type ReactNode } from 'react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { ConfusionMatrix } from '../components/ConfusionMatrix'
import { NoDataArt } from '../components/EmptyStates'
import { ModelMissingNotice, isModelMissing } from '../components/StateNotice'
import { api, type ModelMetrics } from '../lib/api'
import { CHART, pct } from '../lib/chartTheme'

type Importance = Awaited<ReturnType<typeof api.model.featureImportance>>
type State =
  | { kind: 'loading' }
  | { kind: 'missing'; message: string }
  | { kind: 'error' }
  | { kind: 'ready'; m: ModelMetrics; fi: Importance }

function ChartCard({ title, caption, children }: { title: string; caption: string; children: ReactNode }) {
  return (
    <figure className="card p-5">
      <h3 className="font-semibold text-navy-900">{title}</h3>
      <div className="mt-3 h-64">{children}</div>
      <figcaption className="mt-2 text-xs text-ink-subtle">{caption}</figcaption>
    </figure>
  )
}

const axis = { stroke: CHART.axis, fontSize: 12 }

export default function Analytics() {
  const [state, setState] = useState<State>({ kind: 'loading' })
  useEffect(() => {
    Promise.all([api.model.metrics(), api.model.featureImportance()])
      .then(([m, fi]) => setState({ kind: 'ready', m, fi }))
      .catch((e: unknown) =>
        setState(isModelMissing(e) ? { kind: 'missing', message: e.message } : { kind: 'error' }),
      )
  }, [])

  if (state.kind === 'loading')
    return (
      <p role="status" className="text-sm text-ink-muted">
        Loading...
      </p>
    )
  if (state.kind === 'missing') return <ModelMissingNotice message={state.message} />
  if (state.kind === 'error')
    return (
      <div className="card mx-auto max-w-xl p-8 text-center">
        <NoDataArt />
        <p className="mt-3 text-sm text-ink-muted">
          Analytics could not be loaded. Check that the backend is running.
        </p>
      </div>
    )

  const { m, fi } = state
  const roc = m.roc_curve.fpr.map((x, i) => ({ fpr: x, tpr: m.roc_curve.tpr[i] }))
  const pr = m.pr_curve.recall.map((x, i) => ({ recall: x, precision: m.pr_curve.precision[i] }))
  const cal = m.calibration_curve.mean_predicted.map((x, i) => ({
    predicted: x,
    observed: m.calibration_curve.fraction_positive[i],
  }))
  const calMax = Math.min(1, Math.max(0.1, ...cal.flatMap((c) => [c.predicted, c.observed])) * 1.15)
  const prevalence = m.n_test_positive / m.n_test

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <header>
        <h1 className="text-2xl font-bold text-navy-900">Model analytics</h1>
        <p className="mt-1 max-w-3xl text-sm text-ink-muted">
          This page describes how the <strong>model</strong> performed on a held-out test set of {m.n_test}{' '}
          people ({m.n_test_positive} with a recorded stroke). It says nothing about any one person. Your own
          result is on the result page.
        </p>
      </header>

      <dl className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[
          ['Recall (sensitivity)', pct(m.recall)],
          ['Precision', pct(m.precision)],
          ['Specificity', pct(m.specificity)],
          ['F1', m.f1.toFixed(2)],
          ['ROC-AUC', m.roc_auc.toFixed(2)],
          ['PR-AUC', m.pr_auc.toFixed(2)],
          ['Brier score', m.brier.toFixed(3)],
          ['Dummy PR-AUC', m.dummy_baseline.pr_auc.toFixed(2)],
        ].map(([k, v]) => (
          <div key={k} className="card p-4">
            <dt className="text-xs font-semibold uppercase tracking-wide text-ink-subtle">{k}</dt>
            <dd className="mt-1 text-2xl font-bold text-navy-900">{v}</dd>
          </div>
        ))}
      </dl>
      <p className="text-xs text-ink-subtle">
        Decision threshold {m.threshold.toFixed(3)} was chosen on validation data, never on the test set. With
        only {m.n_test_positive} positive cases, every number here is noisy.
      </p>

      <section className="card p-6" aria-labelledby="cm-title">
        <h2 id="cm-title" className="font-semibold text-navy-900">
          Confusion matrix
        </h2>
        <div className="mt-4 max-w-lg">
          <ConfusionMatrix cm={m.confusion_matrix} annotated />
        </div>
      </section>

      <div className="grid gap-4 lg:grid-cols-2">
        <ChartCard
          title="ROC curve"
          caption={`ROC-AUC ${m.roc_auc.toFixed(2)}. The dashed line is a model that guesses at random.`}
        >
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={roc} margin={{ top: 8, right: 12, bottom: 16, left: 0 }}>
              <CartesianGrid stroke={CHART.grid} />
              <XAxis
                type="number"
                dataKey="fpr"
                domain={[0, 1]}
                tickFormatter={(v: number) => v.toFixed(1)}
                label={{ value: 'False positive rate', position: 'insideBottom', offset: -8, fontSize: 12 }}
                {...axis}
              />
              <YAxis
                type="number"
                domain={[0, 1]}
                tickFormatter={(v: number) => v.toFixed(1)}
                label={{ value: 'True positive rate', angle: -90, position: 'insideLeft', fontSize: 12 }}
                {...axis}
              />
              <Tooltip contentStyle={CHART.tooltip} formatter={(v) => Number(v).toFixed(2)} />
              <ReferenceLine
                segment={[
                  { x: 0, y: 0 },
                  { x: 1, y: 1 },
                ]}
                stroke={CHART.muted}
                strokeDasharray="4 4"
              />
              <Line type="monotone" dataKey="tpr" stroke={CHART.teal} strokeWidth={2.5} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>
        <ChartCard
          title="Precision-recall curve"
          caption={`PR-AUC ${m.pr_auc.toFixed(2)}. The dashed line is the share of people with a stroke in the test set (${pct(prevalence)}).`}
        >
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={pr} margin={{ top: 8, right: 12, bottom: 16, left: 0 }}>
              <CartesianGrid stroke={CHART.grid} />
              <XAxis
                type="number"
                dataKey="recall"
                domain={[0, 1]}
                tickFormatter={(v: number) => v.toFixed(1)}
                label={{ value: 'Recall', position: 'insideBottom', offset: -8, fontSize: 12 }}
                {...axis}
              />
              <YAxis
                type="number"
                domain={[0, 1]}
                tickFormatter={(v: number) => v.toFixed(1)}
                label={{ value: 'Precision', angle: -90, position: 'insideLeft', fontSize: 12 }}
                {...axis}
              />
              <Tooltip contentStyle={CHART.tooltip} formatter={(v) => Number(v).toFixed(2)} />
              <ReferenceLine y={prevalence} stroke={CHART.muted} strokeDasharray="4 4" />
              <Line type="monotone" dataKey="precision" stroke={CHART.navy} strokeWidth={2.5} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>
        <ChartCard
          title="Calibration"
          caption="Five equal-sized groups of test predictions. Points near the dashed line mean predicted and observed rates agree. Few positives make this rough."
        >
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={cal} margin={{ top: 8, right: 12, bottom: 16, left: 0 }}>
              <CartesianGrid stroke={CHART.grid} />
              <XAxis
                type="number"
                dataKey="predicted"
                domain={[0, calMax]}
                tickFormatter={(v: number) => v.toFixed(2)}
                label={{ value: 'Mean predicted', position: 'insideBottom', offset: -8, fontSize: 12 }}
                {...axis}
              />
              <YAxis
                type="number"
                domain={[0, calMax]}
                tickFormatter={(v: number) => v.toFixed(2)}
                label={{ value: 'Observed fraction', angle: -90, position: 'insideLeft', fontSize: 12 }}
                {...axis}
              />
              <Tooltip contentStyle={CHART.tooltip} formatter={(v) => Number(v).toFixed(3)} />
              <ReferenceLine
                segment={[
                  { x: 0, y: 0 },
                  { x: calMax, y: calMax },
                ]}
                stroke={CHART.muted}
                strokeDasharray="4 4"
              />
              <Line type="monotone" dataKey="observed" stroke={CHART.teal} strokeWidth={2.5} dot={{ r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>
        <ChartCard
          title="Feature importance"
          caption={`${fi.method}. Longer bars mean the model's score depends more on that feature.`}
        >
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={fi.importances}
              layout="vertical"
              margin={{ top: 4, right: 12, bottom: 4, left: 8 }}
            >
              <CartesianGrid stroke={CHART.grid} horizontal={false} />
              <XAxis type="number" tickFormatter={(v: number) => v.toFixed(2)} {...axis} />
              <YAxis type="category" dataKey="feature" width={118} {...axis} />
              <Tooltip contentStyle={CHART.tooltip} formatter={(v) => Number(v).toFixed(3)} />
              <ReferenceLine x={0} stroke={CHART.axis} />
              <Bar dataKey="mean" fill={CHART.teal} radius={[0, 6, 6, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      <section className="card p-6" aria-labelledby="fi-limits">
        <h2 id="fi-limits" className="font-semibold text-navy-900">
          How to read feature importance
        </h2>
        <ul className="mt-3 list-disc space-y-1.5 pl-5 text-sm text-ink">
          {fi.limitations.map((l) => (
            <li key={l}>{l}</li>
          ))}
        </ul>
      </section>
    </div>
  )
}
