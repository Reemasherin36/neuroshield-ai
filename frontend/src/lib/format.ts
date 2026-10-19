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
