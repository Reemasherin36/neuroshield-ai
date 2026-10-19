import { Component, type ErrorInfo, type ReactNode } from 'react'

interface State {
  hasError: boolean
}

/** Global error boundary: a render error shows a calm recovery screen instead of a blank page. */
export class ErrorBoundary extends Component<{ children: ReactNode }, State> {
  state: State = { hasError: false }
  static getDerivedStateFromError(): State {
    return { hasError: true }
  }
  componentDidCatch(error: Error, info: ErrorInfo) {
    // Log only the technical error. Never log form values or health data.
    console.error('UI error:', error.message, info.componentStack)
  }
  render() {
    if (!this.state.hasError) return this.props.children
    return (
      <div
        role="alert"
        className="mx-auto mt-24 max-w-md rounded-card border border-surface-line bg-white p-8 text-center shadow-card"
      >
        <h1 className="text-xl font-semibold text-navy-900">Something went wrong</h1>
        <p className="mt-2 text-sm text-ink-muted">
          The page hit an unexpected error. Reloading usually fixes it.
        </p>
        <button className="btn-primary mt-6" onClick={() => window.location.assign('/')}>
          Back to home
        </button>
      </div>
    )
  }
}
