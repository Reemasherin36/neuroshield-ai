import { forwardRef, useId, type ReactNode, type SelectHTMLAttributes } from 'react'

interface Props extends SelectHTMLAttributes<HTMLSelectElement> {
  label: ReactNode
  error?: string
  options: { value: string; label: string }[]
}

export const SelectField = forwardRef<HTMLSelectElement, Props>(function SelectField(
  { label, error, options, ...rest },
  ref,
) {
  const id = useId()
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-navy-900">
        {label}
      </label>
      <select
        id={id}
        ref={ref}
        defaultValue=""
        className={`input ${error ? 'border-status-danger' : ''}`}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${id}-err` : undefined}
        {...rest}
      >
        <option value="" disabled>
          Select...
        </option>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      {error && (
        <p id={`${id}-err`} role="alert" className="mt-1 text-xs font-medium text-status-danger">
          {error}
        </p>
      )}
    </div>
  )
})

interface YesNoProps {
  legend: ReactNode
  error?: string
  inputProps: React.InputHTMLAttributes<HTMLInputElement> & { ref?: React.Ref<HTMLInputElement> }
}
export function YesNoField({ legend, error, inputProps }: YesNoProps) {
  const id = useId()
  return (
    <fieldset aria-describedby={error ? `${id}-err` : undefined}>
      <legend className="mb-1.5 text-sm font-medium text-navy-900">{legend}</legend>
      <div className="flex gap-3">
        {[
          ['1', 'Yes'],
          ['0', 'No'],
        ].map(([v, l]) => (
          <label
            key={v}
            className="flex cursor-pointer items-center gap-2 rounded-lg border border-navy-200 bg-white px-4 py-2.5 text-sm has-[:checked]:border-teal-700 has-[:checked]:bg-teal-50"
          >
            <input type="radio" value={v} className="accent-teal-700" {...inputProps} />
            {l}
          </label>
        ))}
      </div>
      {error && (
        <p id={`${id}-err`} role="alert" className="mt-1 text-xs font-medium text-status-danger">
          {error}
        </p>
      )}
    </fieldset>
  )
}
