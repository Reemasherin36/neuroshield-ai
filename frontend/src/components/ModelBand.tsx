import { useEffect, useState } from 'react'
import { api, ApiError, type ModelMetrics } from '../lib/api'

type State =
  | { kind: 'loading' }
  | { kind: 'ready'; m: ModelMetrics }
  | { kind: 'not-trained'; message: string }
  | { kind: 'offline' }

const pct = (x: number) => `${(x * 100).toFixed(1)}%`

/** Landing-page transparency band. Shows numbers only from the real metrics.json; never placeholders. */
export function ModelBand() {
  const [state, setState] = useState<State>({ kind: 'loading' })
  useEffect(() => {
    api.model
      .metrics()
      .then((m) => setState({ kind: 'ready', m }))
      .catch((e: unknown) => {
        if (e instanceof ApiError && e.status === 503) setState({ kind: 'not-trained', message: e.message })
        else setState({ kind: 'offline' })
      })
  }, [])

  return (
    <section aria-labelledby="transparency-title" className="on-dark bg-navy-900 text-white">
      <div className="section">
        <h2 id="transparency-title" className="text-2xl font-bold sm:text-3xl">
          Model transparency
        </h2>
        <p className="mt-3 max-w-2xl text-navy-100">
          These numbers come from one evaluation on a held-out test set, produced by the training scripts in
          this project.
        </p>
        {state.kind === 'loading' && (
          <p role="status" className="mt-8 text-navy-200">
            Loading evaluation results...
          </p>
        )}
        {state.kind === 'not-trained' && (
          <div className="mt-8 rounded-card border border-white/20 bg-white/5 p-6">
            <p className="font-semibold">Train the model to see results</p>
            <p className="mt-1 text-sm text-navy-200">{state.message}</p>
          </div>
        )}
        {state.kind === 'offline' && (
          <div className="mt-8 rounded-card border border-white/20 bg-white/5 p-6">
            <p className="font-semibold">Results unavailable</p>
            <p className="mt-1 text-sm text-navy-200">
              The backend could not be reached, so evaluation results cannot be shown. Start the backend (see
              the README).
            </p>
          </div>
        )}
        {state.kind === 'ready' && (
          <>
            <dl className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
              {[
                ['Recall', pct(state.m.recall)],
                ['Precision', pct(state.m.precision)],
                ['ROC-AUC', state.m.roc_auc.toFixed(2)],
                ['PR-AUC', state.m.pr_auc.toFixed(2)],
              ].map(([k, v]) => (
                <div key={k} className="glass rounded-card p-5">
                  <dt className="text-xs uppercase tracking-wide text-navy-200">{k}</dt>
                  <dd className="mt-1 text-3xl font-bold">{v}</dd>
                </div>
              ))}
            </dl>
            <p className="mt-6 max-w-3xl text-sm text-navy-100">
              Test set: {state.m.n_test} people, {state.m.n_test_positive} with a recorded stroke. With so few
              positive cases these estimates are noisy. Precision is low, which means most people the model
              flags did not have a stroke in this data. The model is a learning exercise, not a screening
              tool.
            </p>
          </>
        )}
      </div>
    </section>
  )
}
