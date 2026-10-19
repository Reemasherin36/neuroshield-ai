import {
  Activity,
  BarChart3,
  ClipboardList,
  Cpu,
  FileText,
  Stethoscope,
  Cigarette,
  Siren,
} from 'lucide-react'
import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { BackgroundSystem } from '../components/Backgrounds'
import { BrainIllustration } from '../components/BrainIllustration'
import {
  GlucoseDropIcon,
  HeartPulseIcon,
  LifestyleIcon,
  PressureGaugeIcon,
  ShieldNodesIcon,
} from '../components/icons'
import { ModelBand } from '../components/ModelBand'

function Chip({ className, icon, label }: { className: string; icon: ReactNode; label: string }) {
  return (
    <div
      className={`glass-dark absolute flex items-center gap-2 rounded-pill px-3.5 py-2 text-sm font-medium text-white shadow-glow motion-safe:animate-float ${className}`}
    >
      <span className="text-cyan-300">{icon}</span>
      {label}
    </div>
  )
}

function Hero() {
  return (
    <section className="on-dark relative isolate overflow-hidden text-white">
      <BackgroundSystem tone="dark" />
      <div className="relative mx-auto grid max-w-6xl items-center gap-10 px-5 py-16 sm:px-8 sm:py-24 lg:grid-cols-2">
        <div>
          <span className="glass inline-flex items-center gap-2 rounded-pill px-3 py-1 text-xs font-semibold uppercase tracking-wide text-cyan-300">
            <Activity className="h-3.5 w-3.5" aria-hidden="true" /> Educational prototype
          </span>
          <h1 className="mt-5 text-4xl font-extrabold leading-tight tracking-tight sm:text-5xl">
            Explore stroke risk factors with a model you can inspect
          </h1>
          <p className="mt-5 max-w-xl text-lg text-navy-100">
            NeuroShield AI is a student project that shows how a risk model is built, tested and explained,
            using public data and open methods.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link to="/assess" className="btn bg-white text-navy-900 hover:bg-navy-50">
              Start assessment
            </Link>
            <a href="#how-it-works" className="btn-ghost-dark">
              How it works
            </a>
          </div>
          <p className="mt-6 max-w-md text-xs text-navy-100">
            Not a diagnostic tool. Results cannot confirm or rule out a stroke.
          </p>
        </div>
        <div className="relative mx-auto w-full max-w-md">
          <BrainIllustration className="w-full drop-shadow-[0_0_40px_rgba(56,208,236,0.35)]" />
          <Chip className="left-0 top-6" icon={<LifestyleIcon className="h-4 w-4" />} label="Age" />
          <Chip
            className="right-0 top-24 [animation-delay:1.5s]"
            icon={<PressureGaugeIcon className="h-4 w-4" />}
            label="Blood pressure"
          />
          <Chip
            className="bottom-10 left-4 [animation-delay:3s]"
            icon={<GlucoseDropIcon className="h-4 w-4" />}
            label="Glucose"
          />
        </div>
      </div>
    </section>
  )
}

function Intro() {
  return (
    <section className="section grid items-center gap-10 md:grid-cols-2">
      <div>
        <h2 className="text-2xl font-bold text-navy-900 sm:text-3xl">What is NeuroShield AI?</h2>
        <p className="mt-4 text-ink-muted">
          It is a research-only web app. You enter a few health and lifestyle details, a machine learning
          model trained on a public dataset produces a result, and the app explains what that result does and
          does not mean.
        </p>
        <p className="mt-3 text-ink-muted">
          It is built to be transparent: the training data limits, the evaluation numbers and the weaknesses
          of the model are all shown in the open.
        </p>
      </div>
      <div className="card flex items-center justify-center bg-gradient-to-br from-navy-50 to-teal-50 p-6">
        <BrainIllustration className="w-56" title="Decorative brain illustration" />
      </div>
    </section>
  )
}

const STEPS = [
  {
    icon: ClipboardList,
    title: 'Enter details',
    text: 'Ten simple inputs such as age, glucose level and smoking status.',
  },
  {
    icon: Cpu,
    title: 'Model analyses',
    text: 'A trained model compares your inputs with patterns in its training data.',
  },
  {
    icon: FileText,
    title: 'Understand the result',
    text: 'See a calm, plain-language band with its uncertainty explained.',
  },
  {
    icon: Stethoscope,
    title: 'Learn and consult a doctor',
    text: 'Read general prevention information and talk to a qualified professional.',
  },
]

function HowItWorks() {
  return (
    <section id="how-it-works" className="bg-white">
      <div className="section">
        <h2 className="text-2xl font-bold text-navy-900 sm:text-3xl">How it works</h2>
        <ol className="relative mt-10 grid gap-8 md:grid-cols-4">
          <div
            aria-hidden="true"
            className="absolute left-0 right-0 top-6 hidden h-px bg-gradient-to-r from-teal-300 via-cyan-400 to-teal-300 md:block"
          />
          {STEPS.map((s, i) => (
            <li key={s.title} className="relative">
              <div className="relative z-10 flex h-12 w-12 items-center justify-center rounded-full bg-accent-gradient text-white shadow-card">
                <s.icon className="h-5 w-5" aria-hidden="true" />
                <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-navy-900 text-xs font-bold">
                  {i + 1}
                </span>
              </div>
              <h3 className="mt-4 font-semibold text-navy-900">{s.title}</h3>
              <p className="mt-1 text-sm text-ink-muted">{s.text}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  )
}

const FEATURES = [
  {
    icon: HeartPulseIcon,
    title: 'Heart and circulation inputs',
    text: 'Records whether heart disease has been diagnosed, alongside age.',
  },
  {
    icon: GlucoseDropIcon,
    title: 'Glucose and BMI',
    text: 'Average glucose (mg/dL) and BMI (kg/m²) with plausible-range checks.',
  },
  {
    icon: PressureGaugeIcon,
    title: 'Blood pressure history',
    text: 'A simple yes/no for diagnosed hypertension, as in the training data.',
  },
  {
    icon: LifestyleIcon,
    title: 'Lifestyle context',
    text: 'Smoking status, work type and residence type, as available in the dataset.',
  },
  {
    icon: ShieldNodesIcon,
    title: 'Consent before saving',
    text: 'You can get a result without saving, and delete saved results at any time.',
  },
  {
    icon: BarChart3,
    title: 'Transparent evaluation',
    text: 'Metrics, calibration and limitations come from a real, documented training run.',
  },
]

function Features() {
  return (
    <section id="features" className="section">
      <h2 className="text-2xl font-bold text-navy-900 sm:text-3xl">Features</h2>
      <ul className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {FEATURES.map((f) => (
          <li key={f.title} className="card p-6">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-teal-50 text-teal-700">
              <f.icon />
            </span>
            <h3 className="mt-4 font-semibold text-navy-900">{f.title}</h3>
            <p className="mt-1 text-sm text-ink-muted">{f.text}</p>
          </li>
        ))}
      </ul>
    </section>
  )
}

const RISKS = [
  {
    icon: PressureGaugeIcon,
    title: 'High blood pressure',
    text: 'Long-term high blood pressure is one of the most important modifiable risk factors for stroke. Regular checks and treatment when advised matter.',
  },
  {
    icon: GlucoseDropIcon,
    title: 'High blood glucose',
    text: 'Diabetes and persistently high glucose are linked with a higher chance of stroke. Managing them with a clinician lowers that risk.',
  },
  {
    icon: Cigarette,
    title: 'Smoking',
    text: 'Smoking raises stroke risk, and the risk falls over time after quitting.',
  },
  {
    icon: LifestyleIcon,
    title: 'Age',
    text: 'Stroke becomes more common as people get older. Age cannot be changed, but other factors often can.',
  },
  {
    icon: HeartPulseIcon,
    title: 'Heart disease',
    text: 'Some heart conditions, including irregular heart rhythms, can increase stroke risk and are worth discussing with a doctor.',
  },
]

function RiskFactors() {
  return (
    <section className="bg-white">
      <div className="section">
        <h2 className="text-2xl font-bold text-navy-900 sm:text-3xl">Understand stroke risk factors</h2>
        <p className="mt-3 max-w-2xl text-ink-muted">
          General information only. It is not advice for any one person.
        </p>
        <ul className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {RISKS.map((r) => (
            <li key={r.title} className="card p-6">
              <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-navy-50 text-navy-700">
                <r.icon className="h-5 w-5" aria-hidden="true" />
              </span>
              <h3 className="mt-3 font-semibold text-navy-900">{r.title}</h3>
              <p className="mt-1 text-sm text-ink-muted">{r.text}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}

function Goals() {
  return (
    <section className="section">
      <h2 className="text-2xl font-bold text-navy-900 sm:text-3xl">Why we built this</h2>
      <div className="mt-6 grid gap-6 md:grid-cols-2">
        <p className="text-ink-muted">
          NeuroShield AI started as a student project to practise building a complete machine learning
          application: data checks, a leakage-free training pipeline, honest evaluation, a secure backend and
          a clear interface.
        </p>
        <ul className="space-y-2 text-sm text-ink-muted">
          <li className="card p-4">
            <strong className="text-navy-900">Project goal 1.</strong> Show every step of the model openly,
            including its weaknesses.
          </li>
          <li className="card p-4">
            <strong className="text-navy-900">Project goal 2.</strong> Keep personal data minimal and under
            the user's control.
          </li>
          <li className="card p-4">
            <strong className="text-navy-900">Project goal 3.</strong> Teach, never reassure and never
            diagnose.
          </li>
        </ul>
      </div>
    </section>
  )
}

const FAQ = [
  [
    'What is NeuroShield AI?',
    'A research-only student project that applies a machine learning model to a public dataset and explains the result.',
  ],
  [
    'What is it not?',
    'It is not a diagnostic tool or a medical device. It cannot diagnose a stroke or rule one out, and a low result is never a reason to ignore symptoms.',
  ],
  [
    'How reliable are the results?',
    'Limited. The training data has few stroke cases and unclear provenance, and the evaluation shows many false alarms. See the methodology page for the real numbers.',
  ],
  [
    'Is my data stored?',
    'Only if you tick the consent box when submitting. You can also get a result without saving. Saved assessments can be deleted one by one or all at once.',
  ],
  [
    'How is my data handled?',
    'The app stores your email, a hashed password and any assessments you choose to save. The local database is not encrypted at rest, so this prototype is not suitable for real patient data.',
  ],
]

function Faq() {
  return (
    <section id="faq" className="bg-white">
      <div className="section max-w-3xl">
        <h2 className="text-2xl font-bold text-navy-900 sm:text-3xl">Frequently asked questions</h2>
        <div className="mt-8 divide-y divide-surface-line rounded-card border border-surface-line">
          {FAQ.map(([q, a]) => (
            <details key={q} className="group p-5">
              <summary className="cursor-pointer list-none font-medium text-navy-900 marker:hidden [&::-webkit-details-marker]:hidden">
                <span
                  className="mr-2 inline-block text-teal-700 transition-transform group-open:rotate-90"
                  aria-hidden="true"
                >
                  ›
                </span>
                {q}
              </summary>
              <p className="mt-3 pl-5 text-sm text-ink-muted">{a}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  )
}

function Emergency() {
  return (
    <section aria-labelledby="emergency-title" className="border-y border-amber-200 bg-amber-50">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-5 py-10 sm:px-8 md:flex-row md:items-start">
        <Siren className="h-8 w-8 shrink-0 text-status-warn" aria-hidden="true" />
        <div>
          <h2 id="emergency-title" className="text-lg font-bold text-navy-900">
            If you suspect a stroke, act now
          </h2>
          <p className="mt-1 text-sm text-ink">
            Call your local emergency number immediately if you notice <strong>F</strong>ace drooping,{' '}
            <strong>A</strong>rm weakness, <strong>S</strong>peech difficulty, sudden severe headache or
            sudden vision loss. <strong>T</strong>ime matters. Do not use this app to decide whether to seek
            help.
          </p>
          <p className="mt-2 text-xs text-ink-muted">
            NeuroShield AI is an educational prototype. It is not medical advice and does not diagnose any
            condition.
          </p>
        </div>
      </div>
    </section>
  )
}

export default function Landing() {
  return (
    <>
      <Hero />
      <Intro />
      <HowItWorks />
      <Features />
      <RiskFactors />
      <ModelBand />
      <Goals />
      <Faq />
      <Emergency />
    </>
  )
}
