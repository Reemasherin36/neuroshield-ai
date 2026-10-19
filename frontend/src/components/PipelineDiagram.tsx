import {
  ArrowRight,
  Boxes,
  Database,
  Eraser,
  Gauge,
  Scissors,
  SlidersHorizontal,
  Wand2,
  type LucideIcon,
} from 'lucide-react'

const STEPS: { icon: LucideIcon; title: string; text: string }[] = [
  { icon: Database, title: 'Dataset', text: 'Public Kaggle CSV' },
  { icon: Eraser, title: 'Cleaning', text: 'Check columns, parse BMI' },
  { icon: Scissors, title: 'Split', text: '60 / 20 / 20, stratified' },
  { icon: SlidersHorizontal, title: 'Preprocessing', text: 'Fit on training data only' },
  { icon: Wand2, title: 'Training', text: 'Three model types, cross-validated' },
  { icon: Gauge, title: 'Evaluation', text: 'Test set used once' },
  { icon: Boxes, title: 'Model', text: 'Saved, loaded by the API' },
]

export function PipelineDiagram() {
  return (
    <ol className="flex gap-2 overflow-x-auto pb-2" aria-label="Pipeline from dataset to model">
      {STEPS.map((s, i) => (
        <li key={s.title} className="flex items-center gap-2">
          <div className="card flex w-36 shrink-0 flex-col items-center p-4 text-center">
            <span className="relative flex h-10 w-10 items-center justify-center rounded-full bg-accent-gradient text-white">
              <s.icon className="h-5 w-5" aria-hidden="true" />
              <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-navy-900 text-[11px] font-bold">
                {i + 1}
              </span>
            </span>
            <p className="mt-2 text-sm font-semibold text-navy-900">{s.title}</p>
            <p className="mt-0.5 text-xs text-ink-muted">{s.text}</p>
          </div>
          {i < STEPS.length - 1 && (
            <ArrowRight className="h-4 w-4 shrink-0 text-teal-500" aria-hidden="true" />
          )}
        </li>
      ))}
    </ol>
  )
}
