import { Navigate, useLocation } from 'react-router-dom'
import { ResultView, type ResultData } from '../components/ResultView'

/** The result arrives via router state, so an unsaved result is never kept anywhere. A refresh returns to the form. */
export default function Result() {
  const state = useLocation().state as { result?: ResultData } | null
  if (!state?.result) return <Navigate to="/assess" replace />
  return <ResultView data={state.result} />
}
