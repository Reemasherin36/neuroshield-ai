import type { AssessmentInput } from './api'

export type Category = 'lower' | 'moderate' | 'higher'

export const CATEGORY_LABEL: Record<Category, string> = {
  lower: 'Lower than typical in the training data',
  moderate: 'Moderate compared with the training data',
  higher: 'Higher than typical in the training data',
}
export const CATEGORY_SHORT: Record<Category, string> = {
  lower: 'Lower',
  moderate: 'Moderate',
  higher: 'Higher',
}
export const CATEGORY_LEVEL: Record<Category, number> = { lower: 1, moderate: 2, higher: 3 }

export const isCategory = (c: string): c is Category => c === 'lower' || c === 'moderate' || c === 'higher'

export const formatDate = (iso: string) =>
  new Date(iso).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })

export const WORK_LABEL: Record<AssessmentInput['work_type'], string> = {
  Private: 'Private sector',
  'Self-employed': 'Self-employed',
  Govt_job: 'Government job',
  children: 'Child (not working)',
  Never_worked: 'Never worked',
}
export const SMOKING_LABEL: Record<AssessmentInput['smoking_status'], string> = {
  'never smoked': 'Never smoked',
  'formerly smoked': 'Formerly smoked',
  smokes: 'Currently smokes',
  Unknown: 'Unknown',
}

// ---- Plain two-state risk wording shown to users ----
export type RiskLevel = 'higher' | 'lower'
/** The model has three internal bands. Users see two: at or above the threshold is higher, anything below is lower. */
export const riskLevel = (c: Category): RiskLevel => (c === 'higher' ? 'higher' : 'lower')
export const RISK_LABEL: Record<RiskLevel, string> = {
  higher: 'Higher stroke risk',
  lower: 'Lower stroke risk',
}

/** Percent text that never rounds a small risk to a misleading "0%". */
export function formatPercent(p: number): string {
  const pct = p * 100
  if (pct < 0.1) return 'under 0.1%'
  return pct < 10 ? `${pct.toFixed(1)}%` : `${Math.round(pct)}%`
}

export const FEATURE_LABEL: Record<string, string> = {
  age: 'Age',
  gender: 'Gender',
  hypertension: 'High blood pressure',
  heart_disease: 'Heart disease',
  ever_married: 'Ever married',
  work_type: 'Work type',
  Residence_type: 'Residence type',
  avg_glucose_level: 'Average glucose',
  bmi: 'BMI',
  smoking_status: 'Smoking',
}

/** Human-readable value for a feature, with units. */
export function describeValue(feature: string, value: number | string): string {
  switch (feature) {
    case 'age':
      return `${value} years`
    case 'avg_glucose_level':
      return `${Number(value).toFixed(0)} mg/dL`
    case 'bmi':
      return `${Number(value).toFixed(1)} kg/m²`
    case 'hypertension':
    case 'heart_disease':
      return Number(value) === 1 ? 'Yes' : 'No'
    case 'work_type':
      return WORK_LABEL[value as AssessmentInput['work_type']] ?? String(value)
    case 'smoking_status':
      return SMOKING_LABEL[value as AssessmentInput['smoking_status']] ?? String(value)
    default:
      return String(value)
  }
}
