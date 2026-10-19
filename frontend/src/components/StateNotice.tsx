import { ApiError } from '../lib/api'
import { ModelNotTrainedArt } from './EmptyStates'

export function ModelMissingNotice({ message }: { message: string }) {
  return (
    <div className="card mx-auto max-w-xl p-8 text-center">
      <ModelNotTrainedArt />
      <h2 className="mt-3 text-lg font-semibold text-navy-900">Model not trained yet</h2>
      <p className="mt-1 text-sm text-ink-muted">{message}</p>
      <p className="mt-3 text-sm text-ink">
        Place the Kaggle CSV in <code>data</code>, run <code>.\scripts\train.ps1</code>, then restart the
        backend.
      </p>
    </div>
  )
}

export const isModelMissing = (e: unknown): e is ApiError => e instanceof ApiError && e.status === 503
export const errorText = (e: unknown) =>
  e instanceof ApiError ? e.message : 'Something went wrong. Please try again.'
