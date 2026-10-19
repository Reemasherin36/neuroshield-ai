import type { ModelMetrics } from '../lib/api'

/** Heatmap-style 2x2 confusion matrix as a real table. Shading shows the share of each ROW (actual group), so rare strokes stay visible. */
export function ConfusionMatrix({
  cm,
  annotated = false,
}: {
  cm: ModelMetrics['confusion_matrix']
  annotated?: boolean
}) {
  const strokes = cm.tp + cm.fn
  const nonStrokes = cm.tn + cm.fp
  const rows = [
    {
      actual: 'No stroke',
      cells: [
        { key: 'tn', n: cm.tn, share: cm.tn / nonStrokes, note: 'Correctly not flagged' },
        { key: 'fp', n: cm.fp, share: cm.fp / nonStrokes, note: 'False alarm' },
      ],
    },
    {
      actual: 'Stroke',
      cells: [
        { key: 'fn', n: cm.fn, share: cm.fn / strokes, note: 'Missed case' },
        { key: 'tp', n: cm.tp, share: cm.tp / strokes, note: 'Caught case' },
      ],
    },
  ]
  return (
    <figure>
      <table
        className="w-full border-separate border-spacing-1.5 text-sm"
        aria-label="Confusion matrix on the test set"
      >
        <thead>
          <tr>
            <td />
            <th scope="col" className="py-1 text-center text-xs font-semibold text-ink-muted">
              Model: not flagged
            </th>
            <th scope="col" className="py-1 text-center text-xs font-semibold text-ink-muted">
              Model: flagged
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.actual}>
              <th scope="row" className="pr-2 text-left text-xs font-semibold text-ink-muted">
                Actually: {r.actual.toLowerCase()}
              </th>
              {r.cells.map((c) => (
                <td
                  key={c.key}
                  className="rounded-lg p-4 text-center"
                  style={{
                    backgroundColor: `rgba(15,118,110,${0.08 + c.share * 0.55})`,
                    color: c.share > 0.55 ? '#fff' : '#0b2545',
                  }}
                >
                  <div className="text-2xl font-bold">{c.n}</div>
                  <div className="text-xs">{c.note}</div>
                  {annotated && (
                    <div className="mt-1 text-[11px] opacity-90">
                      {(c.share * 100).toFixed(0)}% of people who{' '}
                      {r.actual === 'Stroke' ? 'had' : 'did not have'} a stroke
                    </div>
                  )}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      <figcaption className="mt-2 text-xs text-ink-subtle">
        Held-out test set. Rows are what actually happened; columns are what the model said.
      </figcaption>
    </figure>
  )
}
