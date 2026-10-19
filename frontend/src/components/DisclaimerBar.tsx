import { Info } from 'lucide-react'

/** Persistent but unobtrusive notice shown on every page. */
export function DisclaimerBar() {
  return (
    <div className="bg-navy-950 px-4 py-1.5 text-center text-xs text-navy-100">
      <Info className="mr-1.5 inline h-3.5 w-3.5 align-[-2px]" aria-hidden="true" />
      Educational prototype, not medical advice.
    </div>
  )
}
