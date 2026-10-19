import { AlertTriangle, Cigarette, HeartPulse, type LucideIcon } from 'lucide-react'
import { Link } from 'react-router-dom'
import type { AssessmentInput } from '../lib/api'
import { CATEGORY_LABEL, SMOKING_LABEL, WORK_LABEL, type Category } from '../lib/format'
import { EmergencyNotice } from './EmergencyNotice'
import { GlucoseDropIcon, LifestyleIcon, PressureGaugeIcon } from './icons'
import { RiskBand } from './RiskBand'

export interface ResultData {
  category: Category
  probability: number | null
  inputs: AssessmentInput
  threshold: number
  modelVersion: string
  saved: boolean
}

const INTERPRETATION: Record<Category, string> = {
  lower:
    'Your inputs resemble people in the training data who were less often recorded as having a stroke. This is not a statement that you are safe or that stroke is unlikely, and it says nothing about symptoms you may have right now.',
  moderate:
    'Your inputs sit between the lower and higher groups. The model cannot separate this group well, so treat it as a prompt to learn more about risk factors, not as a finding.',
  higher:
    'Your inputs resemble people in the training data who were more often recorded as having a stroke. The model flags many people who never had one, so this is not a diagnosis. It is a reason to talk with a healthcare professional about risk factors.',
}

interface Factor {
  icon: LucideIcon | typeof PressureGaugeIcon
  text: string
}

/** Describes inputs that are commonly discussed risk factors. An empty list is NOT reassurance. */
export function riskFactors(i: AssessmentInput): Factor[] {
  const f: Factor[] = []
  if (i.hypertension === 1)
    f.push({
      icon: PressureGaugeIcon,
      text: 'You reported high blood pressure, a well-recognised risk factor for stroke.',
    })
  if (i.heart_disease === 1)
    f.push({ icon: HeartPulse, text: 'You reported heart disease. Some heart conditions raise stroke risk.' })
  if (i.smoking_status === 'smokes')
    f.push({
      icon: Cigarette,
      text: 'You reported currently smoking, which raises stroke risk. Quitting lowers it over time.',
    })
  if (i.smoking_status === 'formerly smoked')
    f.push({
      icon: Cigarette,
      text: 'You reported having smoked in the past. Risk falls over time after quitting.',
    })
  if (i.age >= 65) f.push({ icon: LifestyleIcon, text: 'Stroke is more common at older ages (65 and over).' })
  if (i.bmi >= 30)
    f.push({
      icon: LifestyleIcon,
      text: 'Your BMI is 30 or higher, a range commonly classed as obesity, which is linked with higher stroke risk.',
    })
  if (i.avg_glucose_level >= 126)
    f.push({
      icon: GlucoseDropIcon,
      text: 'Your glucose value is 126 mg/dL or higher, a level clinicians associate with diabetes when measured fasting. Only a clinician can interpret it.',
    })
  return f
}

const PREVENTION = [
  'Have your blood pressure checked regularly and follow your clinician’s advice if it is high.',
  'If you smoke, ask for help to quit. Support services greatly improve the chance of success.',
  'Be physically active most days and aim for a balanced diet with plenty of vegetables and fruit, and little salt.',
  'If you have diabetes or high glucose, work with your care team on monitoring and treatment.',
  'Limit alcohol, and ask about screening for irregular heart rhythms if you have palpitations or are older.',
]

export function ResultView({ data, extra }: { data: ResultData; extra?: React.ReactNode }) {
  const { inputs: i } = data
  const factors = riskFactors(i)
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <section className="card p-6 sm:p-8" aria-labelledby="result-title">
        <p className="text-xs font-semibold uppercase tracking-wide text-teal-700">
          Model output (experimental)
        </p>
        <h1 id="result-title" className="mt-1 text-2xl font-bold text-navy-900">
          {CATEGORY_LABEL[data.category]}
        </h1>
        <div className="mt-6">
          <RiskBand category={data.category} />
        </div>
        {data.probability !== null && (
          <p className="mt-5 text-sm text-ink-muted">
            Approximate model output: about{' '}
            <strong className="text-navy-900">{(data.probability * 100).toFixed(0)}%</strong>. This is a rough
            estimate from a small, imperfect dataset, not your personal chance of stroke.
          </p>
        )}
        <p className="mt-5 text-ink">{INTERPRETATION[data.category]}</p>
        <div className="mt-5 flex gap-3 rounded-lg bg-navy-50 p-4 text-sm text-ink-muted">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-navy-700" aria-hidden="true" />
          <p>
            <strong className="text-navy-900">About the uncertainty.</strong> The model was trained on few
            stroke cases and, in testing, flagged many people who did not have a stroke while still missing
            some who did. Its bands show where your inputs sit relative to the training data. They do not
            diagnose a stroke or rule one out.
          </p>
        </div>
        <p className="mt-4 text-xs text-ink-subtle">
          Model version {data.modelVersion}.{' '}
          {data.saved ? 'This result was saved to your history.' : 'This result was not saved.'}
        </p>
      </section>

      <EmergencyNotice />

      <section className="card p-6" aria-labelledby="inputs-title">
        <h2 id="inputs-title" className="font-semibold text-navy-900">
          Your inputs
        </h2>
        <dl className="mt-4 grid gap-x-8 gap-y-3 text-sm sm:grid-cols-2">
          {[
            ['Age', `${i.age} years`],
            ['Gender', i.gender],
            ['High blood pressure', i.hypertension ? 'Yes' : 'No'],
            ['Heart disease', i.heart_disease ? 'Yes' : 'No'],
            ['Ever married', i.ever_married],
            ['Work type', WORK_LABEL[i.work_type]],
            ['Residence', i.Residence_type],
            ['Average glucose', `${i.avg_glucose_level} mg/dL`],
            ['BMI', `${i.bmi} kg/m²`],
            ['Smoking', SMOKING_LABEL[i.smoking_status]],
          ].map(([k, v]) => (
            <div key={k} className="flex justify-between gap-4 border-b border-surface-line pb-2">
              <dt className="text-ink-muted">{k}</dt>
              <dd className="font-medium text-navy-900">{v}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section className="card p-6" aria-labelledby="factors-title">
        <h2 id="factors-title" className="font-semibold text-navy-900">
          Risk-factor summary
        </h2>
        {factors.length > 0 ? (
          <ul className="mt-4 space-y-3 text-sm">
            {factors.map((f) => (
              <li key={f.text} className="flex gap-3">
                <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-navy-50 text-navy-700">
                  <f.icon className="h-4 w-4" aria-hidden="true" />
                </span>
                <span className="text-ink">{f.text}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-3 text-sm text-ink-muted">
            None of the commonly discussed risk factors listed here were flagged from your inputs.
          </p>
        )}
        <p className="mt-4 text-xs text-ink-subtle">
          This list covers only the few inputs this tool asks about. Not seeing a factor here does not mean
          your risk is low.
        </p>
      </section>

      <section className="card p-6" aria-labelledby="prevention-title">
        <h2 id="prevention-title" className="font-semibold text-navy-900">
          General ways to reduce stroke risk
        </h2>
        <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-ink">
          {PREVENTION.map((p) => (
            <li key={p}>{p}</li>
          ))}
        </ul>
        <p className="mt-4 text-sm text-ink-muted">
          <strong className="text-navy-900">Please talk to a qualified healthcare professional</strong> about
          your own risk. This information is general and educational.
        </p>
      </section>

      <p className="text-center text-xs text-ink-subtle">
        This is an experimental educational output. It is not a diagnosis and cannot diagnose or rule out a
        stroke.
      </p>
      <div className="flex flex-wrap justify-center gap-3">
        <Link to="/assess" className="btn-primary">
          New assessment
        </Link>
        <Link to="/history" className="btn-secondary">
          View history
        </Link>
        {extra}
      </div>
    </div>
  )
}
