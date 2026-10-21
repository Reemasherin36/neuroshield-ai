import { render } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import App from '../App'
import { AuthProvider } from '../lib/auth'
import type { Assessment, AssessmentInput, Explanation, ModelMetadata, ModelMetrics } from '../lib/api'

export const renderAt = (path: string) =>
  render(
    <MemoryRouter initialEntries={[path]}>
      <AuthProvider>
        <App />
      </AuthProvider>
    </MemoryRouter>,
  )

export const ME = {
  status: 200,
  body: { id: 1, email: 'me@example.com', created_at: '2026-01-01T00:00:00Z' },
}
export const HEALTH_OK = { status: 200, body: { status: 'ok', model_loaded: true, model_message: null } }

export const INPUT: AssessmentInput = {
  age: 67,
  gender: 'Male',
  hypertension: 0,
  heart_disease: 1,
  ever_married: 'Yes',
  work_type: 'Private',
  Residence_type: 'Urban',
  avg_glucose_level: 228.7,
  bmi: 36.6,
  smoking_status: 'formerly smoked',
}

export const assessment = (id: number, category: string, over: Partial<Assessment> = {}): Assessment => ({
  id,
  inputs: INPUT,
  score: 0.12,
  threshold: 0.07,
  category,
  model_version: '0.1.0',
  consent_at: '2026-02-01T10:00:00Z',
  created_at: `2026-02-0${id}T10:00:00Z`,
  ...over,
})

export const METRICS: ModelMetrics = {
  recall: 0.82,
  precision: 0.124,
  f1: 0.215,
  specificity: 0.702,
  roc_auc: 0.823,
  pr_auc: 0.236,
  brier: 0.042,
  confusion_matrix: { tn: 682, fp: 290, fn: 9, tp: 41 },
  n_test: 1022,
  n_test_positive: 50,
  threshold: 0.067,
  model_name: 'hist_gradient_boosting',
  model_version: '0.1.0',
  probability_display_supported: true,
  roc_curve: { fpr: [0, 0.5, 1], tpr: [0, 0.8, 1] },
  pr_curve: { precision: [0.1, 0.2, 1], recall: [1, 0.5, 0] },
  calibration_curve: { mean_predicted: [0.01, 0.05], fraction_positive: [0.02, 0.06] },
  dummy_baseline: { pr_auc: 0.049, roc_auc: 0.5 },
}

export const METADATA: ModelMetadata = {
  model_name: 'hist_gradient_boosting',
  model_version: '0.1.0',
  sklearn_version: '1.9.1',
  training_date: '2026-10-17',
  dataset_sha256: 'abc',
  threshold: 0.067,
  threshold_criterion: 'max validation precision subject to recall >= 0.8',
  features: [],
  calibration: 'sigmoid',
  limitations: [],
  dataset_summary: {
    rows: 5110,
    positives: 249,
    positive_rate: 0.0487,
    bmi_na_strings: 201,
    bmi_missing: 201,
    smoking_unknown: 1544,
    gender_other: 1,
    age_min: 0.08,
    age_max: 82,
    splits: {
      train: { rows: 3066, positives: 149 },
      validation: { rows: 1022, positives: 50 },
      test: { rows: 1022, positives: 50 },
    },
  },
}

const f = (feature: string, value: number | string, typical: number | string, effect: number) => ({
  feature,
  value,
  typical,
  effect,
})
/** Real values returned by the backend for the INPUT profile, rounded. */
export const EXPLAIN: Explanation = {
  category: 'higher',
  probability: 0.131,
  probability_display_supported: true,
  threshold: 0.0674,
  model_version: '0.1.0',
  disclaimer: 'x',
  method: 'Each answer is swapped, one at a time, for the typical value.',
  factors: [
    f('age', 67, 45, 0.1118),
    f('avg_glucose_level', 228.7, 91.665, 0.0524),
    f('heart_disease', 1, 0, 0.0096),
    f('smoking_status', 'formerly smoked', 'never smoked', 0.0087),
    f('bmi', 36.6, 28, -0.0064),
    f('hypertension', 0, 0, 0),
    f('gender', 'Male', 'Female', 0),
    f('ever_married', 'Yes', 'Yes', 0),
    f('work_type', 'Private', 'Private', 0),
    f('Residence_type', 'Urban', 'Rural', 0),
  ],
}
export const EXPLAIN_ROUTE = { status: 200, body: EXPLAIN }
