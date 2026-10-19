import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import App from './App'
import { AuthProvider } from './lib/auth'
import { mockFetch, notTrained, signedOut } from './test/mockApi'

const renderAt = (path: string) =>
  render(
    <MemoryRouter initialEntries={[path]}>
      <AuthProvider>
        <App />
      </AuthProvider>
    </MemoryRouter>,
  )

const METRICS = {
  recall: 0.8,
  precision: 0.1,
  f1: 0.2,
  specificity: 0.7,
  roc_auc: 0.82,
  pr_auc: 0.24,
  brier: 0.04,
  confusion_matrix: { tn: 1, fp: 1, fn: 1, tp: 1 },
  n_test: 1022,
  n_test_positive: 50,
  threshold: 0.07,
  model_name: 'm',
  model_version: '0.1.0',
  probability_display_supported: true,
}

describe('landing page', () => {
  it('renders key sections and the safety content', async () => {
    mockFetch({ ...signedOut, ...notTrained })
    renderAt('/')
    expect(
      await screen.findByRole('heading', { level: 1, name: /explore stroke risk factors/i }),
    ).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /how it works/i })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /if you suspect a stroke, act now/i })).toBeInTheDocument()
    expect(screen.getAllByText(/educational prototype, not medical advice/i).length).toBeGreaterThan(0)
    expect(screen.getAllByText(/not a diagnostic tool/i).length).toBeGreaterThan(0)
  })

  it('shows the train-the-model state when the model is missing, never fake numbers', async () => {
    mockFetch({ ...signedOut, ...notTrained })
    renderAt('/')
    expect(await screen.findByText(/train the model to see results/i)).toBeInTheDocument()
    expect(screen.queryByText(/ROC-AUC/)).not.toBeInTheDocument()
  })

  it('shows real metrics from the API when available', async () => {
    mockFetch({ ...signedOut, 'GET /model/metrics': { status: 200, body: METRICS } })
    renderAt('/')
    expect(await screen.findByText('80.0%')).toBeInTheDocument()
    expect(screen.getByText('0.82')).toBeInTheDocument()
    expect(screen.getByText(/1022 people, 50 with a recorded stroke/i)).toBeInTheDocument()
  })

  it('shows an unavailable state when the backend is unreachable', async () => {
    mockFetch({ ...signedOut }) // /model/metrics is unmocked -> fetch throws -> network error
    renderAt('/')
    expect(await screen.findByText(/results unavailable/i)).toBeInTheDocument()
  })
})

describe('routing and auth', () => {
  it('redirects signed-out users from private routes to login', async () => {
    mockFetch(signedOut)
    renderAt('/dashboard')
    expect(await screen.findByRole('heading', { name: /^sign in$/i })).toBeInTheDocument()
  })

  it('shows the 404 page for unknown routes', async () => {
    mockFetch({ ...signedOut })
    renderAt('/nope')
    expect(await screen.findByRole('heading', { name: /page not found/i })).toBeInTheDocument()
  })

  it('lets a signed-in user see the dashboard with real model status', async () => {
    mockFetch({
      'GET /users/me': {
        status: 200,
        body: { id: 1, email: 'me@example.com', created_at: '2026-01-01T00:00:00Z' },
      },
      'GET /health': { status: 200, body: { status: 'ok', model_loaded: true, model_message: null } },
      'GET /assessments?limit=100&offset=0': {
        status: 200,
        body: { items: [], total: 0, limit: 100, offset: 0 },
      },
    })
    renderAt('/dashboard')
    expect(await screen.findByText(/no saved assessments yet/i)).toBeInTheDocument()
    expect(screen.getAllByText('me@example.com').length).toBeGreaterThan(0)
  })
})

describe('login form', () => {
  it('validates inline without calling the server', async () => {
    const { calls } = mockFetch(signedOut)
    renderAt('/login')
    await userEvent.click(await screen.findByRole('button', { name: /^sign in$/i }))
    expect(await screen.findByText(/enter your email/i)).toBeInTheDocument()
    expect(screen.getByText(/enter your password/i)).toBeInTheDocument()
    expect(calls.some((c) => c.key === 'POST /auth/login')).toBe(false)
  })

  it('shows the server message on failed sign-in', async () => {
    mockFetch({
      ...signedOut,
      'POST /auth/login': {
        status: 401,
        body: {
          error: { code: 'invalid_credentials', message: 'Incorrect email or password.', details: null },
        },
      },
    })
    renderAt('/login')
    await userEvent.type(await screen.findByLabelText(/email/i), 'a@example.com')
    await userEvent.type(screen.getByLabelText(/password/i), 'whatever-pass')
    await userEvent.click(screen.getByRole('button', { name: /^sign in$/i }))
    expect(await screen.findByText(/incorrect email or password/i)).toBeInTheDocument()
  })

  it('signs in and moves to the dashboard on success', async () => {
    mockFetch({
      ...signedOut,
      'POST /auth/login': {
        status: 200,
        body: { id: 1, email: 'a@example.com', created_at: '2026-01-01T00:00:00Z' },
      },
      'GET /health': {
        status: 200,
        body: { status: 'ok', model_loaded: false, model_message: 'Model not trained yet.' },
      },
    })
    renderAt('/login')
    await userEvent.type(await screen.findByLabelText(/email/i), 'a@example.com')
    await userEvent.type(screen.getByLabelText(/password/i), 'whatever-pass')
    await userEvent.click(screen.getByRole('button', { name: /^sign in$/i }))
    await waitFor(() => expect(screen.getByRole('heading', { name: /welcome/i })).toBeInTheDocument())
  })
})

describe('register form', () => {
  it('enforces password length and confirmation', async () => {
    const { calls } = mockFetch(signedOut)
    renderAt('/register')
    await userEvent.type(await screen.findByLabelText(/^email/i), 'new@example.com')
    await userEvent.type(screen.getByLabelText(/^password/i), 'short')
    await userEvent.type(screen.getByLabelText(/confirm password/i), 'different')
    await userEvent.click(screen.getByRole('button', { name: /create account/i }))
    expect(
      await screen.findByText(/at least 10 characters/i, { selector: '[role="alert"]' }),
    ).toBeInTheDocument()
    expect(screen.getByText(/passwords do not match/i)).toBeInTheDocument()
    expect(calls.some((c) => c.key === 'POST /auth/register')).toBe(false)
  })

  it('shows a duplicate-email error on the email field', async () => {
    mockFetch({
      ...signedOut,
      'POST /auth/register': {
        status: 409,
        body: {
          error: {
            code: 'email_taken',
            message: 'An account with this email already exists.',
            details: null,
          },
        },
      },
    })
    renderAt('/register')
    await userEvent.type(await screen.findByLabelText(/^email/i), 'dup@example.com')
    await userEvent.type(screen.getByLabelText(/^password/i), 'long-enough-pass')
    await userEvent.type(screen.getByLabelText(/confirm password/i), 'long-enough-pass')
    await userEvent.click(screen.getByRole('button', { name: /create account/i }))
    expect(await screen.findByText(/already exists/i)).toBeInTheDocument()
  })
})
