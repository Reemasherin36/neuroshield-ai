import { Siren } from 'lucide-react'

export function EmergencyNotice() {
  return (
    <div role="alert" className="flex gap-3 rounded-card border border-amber-300 bg-amber-50 p-5">
      <Siren className="mt-0.5 h-6 w-6 shrink-0 text-status-warn" aria-hidden="true" />
      <div className="text-sm text-ink">
        <p className="font-semibold text-navy-900">
          If you suspect a stroke, call your local emergency number immediately.
        </p>
        <p className="mt-1">
          Warning signs: face drooping, arm weakness, speech difficulty, sudden severe headache, or sudden
          vision loss. Do not wait for a result from this app, and never use a result to decide that symptoms
          can be ignored.
        </p>
      </div>
    </div>
  )
}
