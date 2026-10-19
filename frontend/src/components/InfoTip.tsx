import { Info } from 'lucide-react'
import { useId } from 'react'

/** Keyboard- and hover-accessible tooltip for form fields. */
export function InfoTip({ label, children }: { label: string; children: string }) {
  const id = useId()
  return (
    <span className="group relative inline-block align-middle">
      <button
        type="button"
        aria-label={`More about ${label}`}
        aria-describedby={id}
        className="rounded-full p-0.5 text-ink-subtle hover:text-navy-900"
      >
        <Info className="h-4 w-4" aria-hidden="true" />
      </button>
      <span
        id={id}
        role="tooltip"
        className="invisible absolute left-1/2 top-full z-20 mt-1 w-64 -translate-x-1/2 rounded-lg bg-navy-900 p-3 text-xs font-normal text-white shadow-card group-focus-within:visible group-hover:visible"
      >
        {children}
      </span>
    </span>
  )
}
