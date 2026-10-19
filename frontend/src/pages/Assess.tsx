import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect, useState, type ReactNode } from 'react'
import { useForm } from 'react-hook-form'
import { Link, useNavigate } from 'react-router-dom'
import { FormField } from '../components/FormField'
import { InfoTip } from '../components/InfoTip'
import { ModelNotTrainedArt } from '../components/EmptyStates'
import { SelectField, YesNoField } from '../components/SelectField'
import { api, ApiError } from '../lib/api'
import { assessmentSchema, toInput, type AssessmentForm } from '../lib/schemas'
import type { ResultData } from '../components/ResultView'
import { isCategory } from '../lib/format'

const Section = ({ title, children }: { title: string; children: ReactNode }) => (
  <fieldset className="card p-6">
    <legend className="px-2 text-base font-semibold text-navy-900">{title}</legend>
    <div className="mt-2 grid gap-5 sm:grid-cols-2">{children}</div>
  </fieldset>
)

export default function Assess() {
  const navigate = useNavigate()
  const [modelState, setModelState] = useState<'checking' | 'ready' | 'missing' | 'offline'>('checking')
  const [modelMessage, setModelMessage] = useState('')
  const [formError, setFormError] = useState<string | null>(null)
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<AssessmentForm>({ resolver: zodResolver(assessmentSchema), defaultValues: { consent: false } })

  useEffect(() => {
    api
      .health()
      .then((h) => {
        setModelState(h.model_loaded ? 'ready' : 'missing')
        setModelMessage(h.model_message ?? '')
      })
      .catch(() => setModelState('offline'))
  }, [])

  const run = (save: boolean) =>
    handleSubmit(async (values) => {
      setFormError(null)
      if (save && !values.consent) {
        setError('consent', {
          message: 'Tick the consent box to save this result, or choose "Get result without saving".',
        })
        return
      }
      const inputs = toInput(values)
      try {
        const res = save ? await api.assessments.save(inputs, true) : await api.predict(inputs)
        if (!isCategory(res.category)) throw new Error('Unexpected result from the server.')
        const result: ResultData = {
          category: res.category,
          probability: res.probability,
          inputs,
          threshold: res.threshold,
          modelVersion: res.model_version,
          saved: save,
        }
        navigate('/result', { state: { result } })
      } catch (e) {
        if (e instanceof ApiError && e.code === 'model_unavailable') setModelState('missing')
        setFormError(e instanceof ApiError ? e.message : 'Something went wrong. Please try again.')
      }
    })

  if (modelState === 'missing') {
    return (
      <div className="mx-auto max-w-xl text-center">
        <ModelNotTrainedArt />
        <h1 className="mt-4 text-2xl font-bold text-navy-900">Model not trained yet</h1>
        <p className="mt-2 text-ink-muted">
          {modelMessage || 'The backend has no trained model, so assessments are unavailable.'}
        </p>
        <ol className="mx-auto mt-5 max-w-md list-decimal space-y-1 pl-5 text-left text-sm text-ink">
          <li>
            Download the Kaggle dataset and place the CSV in the <code>data</code> folder.
          </li>
          <li>
            Run <code>.\scripts\train.ps1</code> from the project root.
          </li>
          <li>Restart the backend, then reload this page.</li>
        </ol>
      </div>
    )
  }

  return (
    <form noValidate className="mx-auto max-w-3xl space-y-6" onSubmit={(e) => e.preventDefault()}>
      <header>
        <h1 className="text-2xl font-bold text-navy-900">New assessment</h1>
        <p className="mt-1 text-sm text-ink-muted">
          Ten inputs, about two minutes. This is an educational tool and not medical advice.
        </p>
      </header>
      {modelState === 'offline' && (
        <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-status-danger">
          The backend could not be reached. Start it and reload this page.
        </p>
      )}

      <Section title="About you">
        <FormField
          label="Age (years)"
          tip={
            <InfoTip label="age">
              Age in years. Use a decimal for infants, for example 0.5. Allowed range 0 to 120.
            </InfoTip>
          }
          type="number"
          step="any"
          inputMode="decimal"
          error={errors.age?.message}
          {...register('age', { valueAsNumber: true })}
        />
        <SelectField
          label="Gender"
          options={[
            { value: 'Male', label: 'Male' },
            { value: 'Female', label: 'Female' },
            { value: 'Other', label: 'Other' },
          ]}
          error={errors.gender?.message}
          {...register('gender')}
        />
        <SelectField
          label="Ever married"
          options={[
            { value: 'Yes', label: 'Yes' },
            { value: 'No', label: 'No' },
          ]}
          error={errors.ever_married?.message}
          {...register('ever_married')}
        />
        <SelectField
          label="Residence type"
          options={[
            { value: 'Urban', label: 'Urban' },
            { value: 'Rural', label: 'Rural' },
          ]}
          error={errors.Residence_type?.message}
          {...register('Residence_type')}
        />
        <SelectField
          label="Work type"
          options={[
            { value: 'Private', label: 'Private sector' },
            { value: 'Self-employed', label: 'Self-employed' },
            { value: 'Govt_job', label: 'Government job' },
            { value: 'children', label: 'Child (not working)' },
            { value: 'Never_worked', label: 'Never worked' },
          ]}
          error={errors.work_type?.message}
          {...register('work_type')}
        />
      </Section>

      <Section title="Health">
        <YesNoField
          legend={
            <>
              Diagnosed high blood pressure{' '}
              <InfoTip label="high blood pressure">
                Whether a clinician has told you that you have hypertension.
              </InfoTip>
            </>
          }
          error={errors.hypertension?.message}
          inputProps={register('hypertension')}
        />
        <YesNoField
          legend={
            <>
              Diagnosed heart disease{' '}
              <InfoTip label="heart disease">
                Whether a clinician has told you that you have a heart condition.
              </InfoTip>
            </>
          }
          error={errors.heart_disease?.message}
          inputProps={register('heart_disease')}
        />
        <FormField
          label="Average glucose (mg/dL)"
          tip={
            <InfoTip label="average glucose">
              Your average blood glucose in mg/dL. Allowed range 40 to 500. If your result is in mmol/L,
              multiply by 18.
            </InfoTip>
          }
          type="number"
          step="any"
          inputMode="decimal"
          error={errors.avg_glucose_level?.message}
          {...register('avg_glucose_level', { valueAsNumber: true })}
        />
        <FormField
          label="BMI (kg/m²)"
          tip={
            <InfoTip label="BMI">
              Body mass index: weight in kilograms divided by height in metres squared. Allowed range 10 to
              80.
            </InfoTip>
          }
          type="number"
          step="any"
          inputMode="decimal"
          error={errors.bmi?.message}
          {...register('bmi', { valueAsNumber: true })}
        />
      </Section>

      <Section title="Lifestyle">
        <SelectField
          label="Smoking status"
          options={[
            { value: 'never smoked', label: 'Never smoked' },
            { value: 'formerly smoked', label: 'Formerly smoked' },
            { value: 'smokes', label: 'Currently smokes' },
            { value: 'Unknown', label: 'Unknown / prefer not to say' },
          ]}
          error={errors.smoking_status?.message}
          {...register('smoking_status')}
        />
      </Section>

      <section className="card p-6" aria-labelledby="consent-title">
        <h2 id="consent-title" className="font-semibold text-navy-900">
          Saving your result
        </h2>
        <label className="mt-3 flex cursor-pointer items-start gap-3 text-sm text-ink">
          <input type="checkbox" className="mt-1 h-4 w-4 accent-teal-700" {...register('consent')} />
          <span>
            I agree that NeuroShield AI may store these inputs and the result in my history so I can view them
            later. I can delete them at any time in History or Settings.
          </span>
        </label>
        {errors.consent && (
          <p role="alert" className="mt-2 text-xs font-medium text-status-danger">
            {errors.consent.message}
          </p>
        )}
        <p className="mt-3 text-xs text-ink-subtle">
          Not saving? Choose "Get result without saving": nothing is stored.{' '}
          <Link to="/methodology#data-handling" className="underline">
            How data is handled
          </Link>
        </p>
      </section>

      {formError && (
        <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-status-danger">
          {formError}
        </p>
      )}
      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          className="btn-primary"
          disabled={isSubmitting || modelState === 'offline'}
          onClick={run(true)}
        >
          {isSubmitting ? 'Working...' : 'Save and get result'}
        </button>
        <button
          type="button"
          className="btn-secondary"
          disabled={isSubmitting || modelState === 'offline'}
          onClick={run(false)}
        >
          Get result without saving
        </button>
      </div>
    </form>
  )
}
