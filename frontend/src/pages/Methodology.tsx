import { useEffect, useState, type ReactNode } from 'react'
import { ConfusionMatrix } from '../components/ConfusionMatrix'
import { PipelineDiagram } from '../components/PipelineDiagram'
import { api, type ModelMetadata, type ModelMetrics } from '../lib/api'
import { pct } from '../lib/chartTheme'

type Real =
  { kind: 'loading' } | { kind: 'missing' } | { kind: 'ready'; meta: ModelMetadata; m: ModelMetrics }

const H2 = ({ id, children }: { id?: string; children: ReactNode }) => (
  <h2 id={id} className="mt-12 scroll-mt-24 text-xl font-bold text-navy-900 sm:text-2xl">
    {children}
  </h2>
)
const P = ({ children }: { children: ReactNode }) => <p className="mt-3 text-ink-muted">{children}</p>

export default function Methodology() {
  const [real, setReal] = useState<Real>({ kind: 'loading' })
  useEffect(() => {
    Promise.all([api.model.metadata(), api.model.metrics()])
      .then(([meta, m]) => setReal({ kind: 'ready', meta, m }))
      .catch(() => setReal({ kind: 'missing' }))
  }, [])
  const ds = real.kind === 'ready' ? real.meta.dataset_summary : null

  return (
    <article className="mx-auto max-w-3xl px-5 py-12 sm:px-8">
      <h1 className="text-3xl font-bold text-navy-900">Methodology</h1>
      <P>
        A plain-language walk through how this model was built and tested. Numbers below come from the real
        training run. If the model has not been trained, the parts that need numbers say so instead of showing
        placeholders.
      </P>
      {real.kind === 'missing' && (
        <p role="status" className="mt-4 rounded-lg bg-navy-50 p-4 text-sm text-ink">
          Real numbers are unavailable right now: the backend is not reachable or the model has not been
          trained. Run <code>.\scripts\train.ps1</code> and start the backend.
        </p>
      )}

      <H2>The pipeline at a glance</H2>
      <div className="mt-4">
        <PipelineDiagram />
      </div>

      <H2>The dataset</H2>
      <P>
        The model learns from the public Kaggle "Stroke Prediction Dataset". Each row is one person with ten
        inputs (age, gender, high blood pressure, heart disease, ever married, work type, residence type,
        average glucose, BMI, smoking status) and whether a stroke was recorded. Its origin is not well
        documented, so it is a learning dataset, not clinical evidence.
      </P>
      {ds ? (
        <>
          <figure className="mt-5">
            <div
              className="flex h-8 overflow-hidden rounded-pill border border-surface-line"
              role="img"
              aria-label={`${ds.positives} of ${ds.rows} people had a recorded stroke`}
            >
              <div className="bg-navy-500" style={{ width: `${Math.max(ds.positive_rate * 100, 1.5)}%` }} />
              <div className="flex-1 bg-teal-100" />
            </div>
            <figcaption className="mt-2 text-sm text-ink-muted">
              <strong className="text-navy-900">{ds.positives}</strong> of{' '}
              <strong className="text-navy-900">{ds.rows}</strong> people ({pct(ds.positive_rate, 2)}) have a
              recorded stroke. This imbalance is why accuracy is a misleading score here: a model that always
              says "no stroke" would be right about 95% of the time.
            </figcaption>
          </figure>
          <h3 className="mt-6 font-semibold text-navy-900">Things found in the data</h3>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-ink">
            <li>
              {ds.bmi_na_strings} BMI values were written as the text "N/A" and were treated as missing.
            </li>
            <li>
              {ds.smoking_unknown} people have smoking status "Unknown", which is a category of its own, not a
              missing value.
            </li>
            <li>
              {ds.gender_other} person has gender "Other", too few for the model to learn anything about that
              group.
            </li>
            <li>
              Ages run from {ds.age_min} to {ds.age_max} years, so children are included.
            </li>
          </ul>
        </>
      ) : (
        real.kind === 'loading' && (
          <p role="status" className="mt-4 text-sm text-ink-muted">
            Loading dataset facts...
          </p>
        )
      )}

      <H2>Preparing the data</H2>
      <P>
        The data is split once into training (60%), validation (20%) and test (20%) parts, keeping the same
        share of stroke cases in each. The test part is locked away until the very end. Missing BMI is filled
        with the training median and flagged with a "was missing" marker, numbers are scaled, and categories
        are one-hot encoded. All of these steps learn their settings from the training part only, so no
        information leaks in from validation or test data.
      </P>
      {ds && (
        <p className="mt-3 text-sm text-ink-muted">
          Split sizes: training {ds.splits.train.rows} ({ds.splits.train.positives} strokes), validation{' '}
          {ds.splits.validation.rows} ({ds.splits.validation.positives}), test {ds.splits.test.rows} (
          {ds.splits.test.positives}).
        </p>
      )}

      <H2>Training and choosing a model</H2>
      <P>
        Three kinds of model were compared with five-fold cross-validation and a small search over settings:
        logistic regression, random forest and gradient boosting. Because strokes are rare, stroke cases were
        given extra weight during training. Models were ranked by precision-recall AUC on the validation part,
        not by accuracy. The scores were then calibrated so they behave more like probabilities.
      </P>
      {real.kind === 'ready' && (
        <P>
          Selected model: <strong className="text-navy-900">{real.meta.model_name.replace(/_/g, ' ')}</strong>
          , version {real.meta.model_version}. The decision threshold ({real.meta.threshold.toFixed(3)}) was
          picked on the validation part: {real.meta.threshold_criterion}.
        </P>
      )}

      <H2>How it is scored</H2>
      <ul className="mt-3 space-y-2 text-sm text-ink">
        <li>
          <strong>Recall</strong>: of the people who had a stroke, how many the model flagged.
        </li>
        <li>
          <strong>Precision</strong>: of the people the model flagged, how many had a stroke.
        </li>
        <li>
          <strong>Specificity</strong>: of the people without a stroke, how many were correctly not flagged.
        </li>
        <li>
          <strong>ROC-AUC and PR-AUC</strong>: how well the scores rank people overall. PR-AUC is the more
          telling one when positives are rare.
        </li>
        <li>
          <strong>Brier score</strong>: how close the predicted probabilities are to what happened. Lower is
          better.
        </li>
      </ul>
      {real.kind === 'ready' && (
        <div className="mt-6 grid items-start gap-6 md:grid-cols-2">
          <div>
            <h3 className="font-semibold text-navy-900">How to read the confusion matrix</h3>
            <p className="mt-2 text-sm text-ink-muted">
              Each box counts people on the held-out test set. The top row is people without a stroke, the
              bottom row people with one. The right column is who the model flagged. The two boxes that hurt
              are <em>false alarms</em> (top right) and <em>missed cases</em> (bottom left).
            </p>
          </div>
          <ConfusionMatrix cm={real.m.confusion_matrix} />
        </div>
      )}
      {real.kind === 'ready' && (
        <p className="mt-4 text-sm text-ink-muted">
          Test results (evaluated once): recall {pct(real.m.recall)}, precision {pct(real.m.precision)},
          specificity {pct(real.m.specificity)}, ROC-AUC {real.m.roc_auc.toFixed(2)}, PR-AUC{' '}
          {real.m.pr_auc.toFixed(2)}.
        </p>
      )}

      <H2 id="limitations">Limitations</H2>
      <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-ink">
        <li>Few stroke cases, so every result is noisy and small differences between models mean little.</li>
        <li>Precision is low: most people the model flags did not have a stroke in this data.</li>
        <li>
          The dataset has unclear origin and is not a clinical cohort. It may not represent you or any real
          population.
        </li>
        <li>
          Only ten inputs are used. Many important factors (family history, medication, atrial fibrillation,
          cholesterol) are absent.
        </li>
        <li>
          The model finds associations, not causes. Feature importance does not show what matters medically.
        </li>
        <li>
          It was checked on one split of one dataset. It has not been validated in any clinical setting.
        </li>
      </ul>

      <H2 id="data-handling">Privacy and data handling</H2>
      <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-ink">
        <li>Account data: your email and a one-way password hash.</li>
        <li>
          Assessments are saved only if you tick the consent box. A result you get without saving is not
          stored anywhere.
        </li>
        <li>You can delete one assessment, all assessments, or your whole account at any time.</li>
        <li>
          The local SQLite database is not encrypted at rest and the prototype is not production-grade. Do not
          enter real patient data.
        </li>
        <li>This project makes no claim of compliance with any healthcare privacy law.</li>
      </ul>

      <p className="mt-12 rounded-card border border-amber-300 bg-amber-50 p-4 text-sm text-ink">
        NeuroShield AI is an educational prototype. It cannot diagnose a stroke or rule one out. If you
        suspect a stroke, call your local emergency number immediately.
      </p>
    </article>
  )
}
