import { AlertTriangle, Cigarette, HeartPulse, type LucideIcon } from 'lucide-react'
import { Link } from 'react-router-dom'
import type { AssessmentInput } from '../lib/api'
import { SMOKING_LABEL, WORK_LABEL, riskLevel, type Category } from '../lib/format'
import { EmergencyNotice } from './EmergencyNotice'
import { GlucoseDropIcon, LifestyleIcon, PressureGaugeIcon } from './icons'
import { FactorSection, useExplanation } from './FactorSection'
import { RiskHeadline } from './RiskHeadline'

export interface ResultData {
  category: Category
  probability: number | null
  inputs: AssessmentInput
  threshold: number
  modelVersion: string
  saved: boolean
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
  const explanation = useExplanation(i)
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <section className="card p-6 sm:p-8" aria-labelledby="result-title">
        <RiskHeadline
          level={riskLevel(data.category)}
          probability={data.probability}
          threshold={data.threshold}
        />
        <div className="mt-5 flex gap-3 rounded-lg bg-navy-50 p-4 text-sm text-ink-muted">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-navy-700" aria-hidden="true" />
          <p>
            <strong className="text-navy-900">How much to trust this.</strong> The estimate comes from a small
            public dataset and misses many things that matter, such as family history and medication. It can
            flag people who never have a stroke and miss people who do. Use it to start a conversation with a
            doctor, not to decide anything on your own.
          </p>
        </div>
        <p className="mt-4 text-xs text-ink-subtle">
          Model version {data.modelVersion}.{' '}
          {data.saved ? 'This result was saved to your history.' : 'This result was not saved.'}
        </p>
      </section>

      <EmergencyNotice />

      <section className="card p-6" aria-labelledby="drivers-title">
        <h2 id="drivers-title" className="font-semibold text-navy-900">
          What is driving your result
        </h2>
        <div className="mt-3">
          <FactorSection state={explanation} />
        </div>
      </section>

      <section className="card p-6" aria-labelledby="inputs-title">
        <h2 id="inputs-title" className="font-semibold text-navy-900">
          Your answers
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
          Recognised risk factors you reported
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
            None of the commonly discussed risk factors listed here were flagged from your answers.
          </p>
        )}
        <p className="mt-4 text-xs text-ink-subtle">
          This list covers only the few things this tool asks about. Not seeing a factor here does not mean
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
