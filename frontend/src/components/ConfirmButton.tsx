import { useState } from 'react'

/** Two-step destructive action without a modal: first click asks, second click confirms. */
export function ConfirmButton({
  label,
  confirmLabel,
  onConfirm,
  className = 'btn-secondary',
}: {
  label: string
  confirmLabel: string
  onConfirm: () => void | Promise<void>
  className?: string
}) {
  const [asking, setAsking] = useState(false)
  if (!asking)
    return (
      <button type="button" className={className} onClick={() => setAsking(true)}>
        {label}
      </button>
    )
  return (
    <span className="inline-flex items-center gap-2" role="group" aria-label="Confirm deletion">
      <button
        type="button"
        className="btn bg-status-danger text-white hover:bg-red-800"
        onClick={async () => {
          await onConfirm()
          setAsking(false)
        }}
      >
        {confirmLabel}
      </button>
      <button type="button" className="btn-secondary" onClick={() => setAsking(false)}>
        Cancel
      </button>
    </span>
  )
}
