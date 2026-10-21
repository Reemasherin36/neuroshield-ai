import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import App from './App'
import { AuthProvider } from './lib/auth'
import { mockFetch, signedOut } from './test/mockApi'

const renderAt = (path: string) =>
  render(
    <MemoryRouter initialEntries={[path]}>
      <AuthProvider>
        <App />
      </AuthProvider>
    </MemoryRouter>,
  )

describe('landing page', () => {
  it('renders the user-facing sections and the safety content', async () => {
    mockFetch({ ...signedOut })
    renderAt('/')
    expect(await screen.findByRole('heading', { level: 1, name: /higher or lower/i })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /how it works/i })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /how your risk is identified/i })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /if you suspect a stroke, act now/i })).toBeInTheDocument()
    expect(screen.getAllByText(/educational prototype, not medical advice/i).length).toBeGreaterThan(0)
    expect(screen.getAllByText(/not a diagnostic tool/i).length).toBeGreaterThan(0)
  })

  it('lists the ten details the result is based on', async () => {
    mockFetch({ ...signedOut })
    renderAt('/')
    const section = (await screen.findByRole('heading', { name: /how your risk is identified/i })).closest(
      'section',
    ) as HTMLElement
    for (const d of [
      'Age',
      'High blood pressure',
      'Heart disease',
      'Average glucose level',
      'BMI',
      'Smoking status',
    ]) {
      expect(within(section).getByText(d)).toBeInTheDocument()
    }
    expect(within(section).getAllByRole('listitem')).toHaveLength(10)
  })

  it('has no model-quality material and makes no model-metrics request', async () => {
    const { calls } = mockFetch({ ...signedOut })
    renderAt('/')
    await screen.findByRole('heading', { level: 1 })
    expect(screen.queryByText(/model transparency/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/ROC-AUC|PR-AUC|precision|recall/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/why we built this|student project/i)).not.toBeInTheDocument()
    expect(calls.some((c) => c.key.includes('/model/'))).toBe(false)
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
