import { forwardRef, useId, type InputHTMLAttributes, type ReactNode } from 'react'

interface Props extends InputHTMLAttributes<HTMLInputElement> {
  label: string
  /** Optional tooltip, rendered beside (not inside) the label so the label stays unambiguous. */
  tip?: ReactNode
  error?: string
  hint?: string
}

/** Accessible labelled input: label, hint and error are all programmatically linked. */
export const FormField = forwardRef<HTMLInputElement, Props>(function FormField(
  { label, error, hint, ...rest },
  ref,
) {
  const id = useId()
  const describedBy =
    [hint ? `${id}-hint` : null, error ? `${id}-err` : null].filter(Boolean).join(' ') || undefined
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-navy-900">
        {label}
      </label>
      <input
        id={id}
        ref={ref}
        className={`input ${error ? 'border-status-danger' : ''}`}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy}
        {...rest}
      />
      {hint && (
        <p id={`${id}-hint`} className="mt-1 text-xs text-ink-muted">
          {hint}
        </p>
      )}
      {error && (
        <p id={`${id}-err`} role="alert" className="mt-1 text-xs font-medium text-status-danger">
          {error}
        </p>
      )}
    </div>
  )
})
