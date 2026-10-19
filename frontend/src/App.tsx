import { lazy, Suspense } from 'react'
import { Route, Routes } from 'react-router-dom'
import { AppLayout } from './components/AppLayout'
import { ProtectedRoute } from './components/ProtectedRoute'
import { PublicLayout } from './components/PublicLayout'
import { ScrollToHash } from './components/ScrollToHash'
import Assess from './pages/Assess'
import History from './pages/History'
import HistoryDetail from './pages/HistoryDetail'
import Landing from './pages/Landing'
import Login from './pages/Login'
import Methodology from './pages/Methodology'
import NotFound from './pages/NotFound'
import Register from './pages/Register'
import Result from './pages/Result'
import Settings from './pages/Settings'

// Chart-heavy pages are loaded on demand so the landing page stays light.
const Dashboard = lazy(() => import('./pages/Dashboard'))
const Analytics = lazy(() => import('./pages/Analytics'))

export default function App() {
  return (
    <>
      <ScrollToHash />
      <Suspense
        fallback={
          <p role="status" className="p-10 text-center text-ink-muted">
            Loading...
          </p>
        }
      >
        <Routes>
          <Route element={<PublicLayout />}>
            <Route path="/" element={<Landing />} />
            <Route path="/methodology" element={<Methodology />} />
            <Route path="*" element={<NotFound />} />
          </Route>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route element={<ProtectedRoute />}>
            <Route element={<AppLayout />}>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/assess" element={<Assess />} />
              <Route path="/result" element={<Result />} />
              <Route path="/history" element={<History />} />
              <Route path="/history/:id" element={<HistoryDetail />} />
              <Route path="/analytics" element={<Analytics />} />
              <Route path="/settings" element={<Settings />} />
            </Route>
          </Route>
        </Routes>
      </Suspense>
    </>
  )
}
