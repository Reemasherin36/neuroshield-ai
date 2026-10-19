// Typed API client. All errors are normalised to ApiError (matches the backend's error format).

const BASE = (import.meta.env.VITE_API_URL as string | undefined) ?? 'http://localhost:8000/api/v1'

export class ApiError extends Error {
  status: number
  code: string
  details: { field: string; message: string }[] | null
  constructor(status: number, code: string, message: string, details: ApiError['details'] = null) {
    super(message)
    this.status = status
    this.code = code
    this.details = details
  }
  /** True when the server could not be reached at all. */
  get isNetwork() {
    return this.status === 0
  }
}

type Listener = () => void
const unauthorizedListeners = new Set<Listener>()
/** Lets the auth context react to any 401 from a private route (e.g. an expired session). */
export const onUnauthorized = (fn: Listener) => {
  unauthorizedListeners.add(fn)
  return () => {
    unauthorizedListeners.delete(fn)
  }
}

async function request<T>(path: string, init: RequestInit & { json?: unknown } = {}): Promise<T> {
  const { json, headers, ...rest } = init
  let res: Response
  try {
    res = await fetch(`${BASE}${path}`, {
      ...rest,
      credentials: 'include',
      headers: { ...(json !== undefined ? { 'Content-Type': 'application/json' } : {}), ...headers },
      body: json !== undefined ? JSON.stringify(json) : undefined,
    })
  } catch {
    throw new ApiError(0, 'network_error', 'Could not reach the server. Is the backend running?')
  }
  if (res.status === 204) return undefined as T
  let body: unknown = null
  try {
    body = await res.json()
  } catch {
    /* non-JSON error body */
  }
  if (!res.ok) {
    const err = (
      body as { error?: { code?: string; message?: string; details?: ApiError['details'] } } | null
    )?.error
    const apiErr = new ApiError(
      res.status,
      err?.code ?? 'http_error',
      err?.message ?? `Request failed (${res.status}).`,
      err?.details ?? null,
    )
    if (res.status === 401 && apiErr.code === 'not_authenticated') unauthorizedListeners.forEach((fn) => fn())
    throw apiErr
  }
  return body as T
}

// ---- Types (mirror backend schemas) ----
export interface User {
  id: number
  email: string
  created_at: string
}
export interface AssessmentInput {
  age: number
  gender: 'Male' | 'Female' | 'Other'
  hypertension: 0 | 1
  heart_disease: 0 | 1
  ever_married: 'Yes' | 'No'
  work_type: 'Private' | 'Self-employed' | 'Govt_job' | 'children' | 'Never_worked'
  Residence_type: 'Urban' | 'Rural'
  avg_glucose_level: number
  bmi: number
  smoking_status: 'never smoked' | 'formerly smoked' | 'smokes' | 'Unknown'
}
export interface Prediction {
  category: 'lower' | 'moderate' | 'higher'
  probability: number | null
  probability_display_supported: boolean
  threshold: number
  model_version: string
  disclaimer: string
}
export interface Assessment {
  id: number
  inputs: AssessmentInput
  score: number
  threshold: number
  category: string
  model_version: string
  consent_at: string
  created_at: string
}
export interface AssessmentPage {
  items: Assessment[]
  total: number
  limit: number
  offset: number
}
export interface ModelMetrics {
  recall: number
  precision: number
  f1: number
  specificity: number
  roc_auc: number
  pr_auc: number
  brier: number
  confusion_matrix: { tn: number; fp: number; fn: number; tp: number }
  n_test: number
  n_test_positive: number
  threshold: number
  model_name: string
  model_version: string
  probability_display_supported: boolean
  roc_curve: { fpr: number[]; tpr: number[] }
  pr_curve: { precision: number[]; recall: number[] }
  calibration_curve: { mean_predicted: number[]; fraction_positive: number[] }
  dummy_baseline: { pr_auc: number; roc_auc: number }
}

export interface DatasetSummary {
  rows: number
  positives: number
  positive_rate: number
  bmi_na_strings: number
  bmi_missing: number
  smoking_unknown: number
  gender_other: number
  age_min: number
  age_max: number
  splits: Record<'train' | 'validation' | 'test', { rows: number; positives: number }>
}
export interface ModelMetadata {
  model_name: string
  model_version: string
  sklearn_version: string
  training_date: string
  dataset_sha256: string
  threshold: number
  threshold_criterion: string
  features: string[]
  calibration: string
  limitations: string[]
  dataset_summary: DatasetSummary | null
}

// ---- Endpoints ----
export const api = {
  health: () => request<{ status: string; model_loaded: boolean; model_message: string | null }>('/health'),
  auth: {
    register: (email: string, password: string) =>
      request<User>('/auth/register', { method: 'POST', json: { email, password } }),
    login: (email: string, password: string) =>
      request<User>('/auth/login', { method: 'POST', json: { email, password } }),
    logout: () => request<void>('/auth/logout', { method: 'POST' }),
  },
  users: {
    me: () => request<User>('/users/me'),
    changePassword: (current_password: string, new_password: string) =>
      request<void>('/users/me/password', { method: 'PATCH', json: { current_password, new_password } }),
    remove: (password: string) => request<void>('/users/me', { method: 'DELETE', json: { password } }),
  },
  predict: (inputs: AssessmentInput) => request<Prediction>('/predictions', { method: 'POST', json: inputs }),
  assessments: {
    save: (inputs: AssessmentInput, consent: boolean) =>
      request<Prediction & { id: number }>('/assessments', { method: 'POST', json: { inputs, consent } }),
    list: (limit = 20, offset = 0) => request<AssessmentPage>(`/assessments?limit=${limit}&offset=${offset}`),
    get: (id: number) => request<Assessment>(`/assessments/${id}`),
    remove: (id: number) => request<void>(`/assessments/${id}`, { method: 'DELETE' }),
    removeAll: () => request<void>('/assessments', { method: 'DELETE' }),
  },
  model: {
    metadata: () => request<ModelMetadata>('/model/metadata'),
    metrics: () => request<ModelMetrics>('/model/metrics'),
    featureImportance: () =>
      request<{
        method: string
        importances: { feature: string; mean: number; std: number }[]
        limitations: string[]
      }>('/model/feature-importance'),
  },
}
