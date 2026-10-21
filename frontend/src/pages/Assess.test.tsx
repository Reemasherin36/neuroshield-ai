import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { EXPLAIN_ROUTE, HEALTH_OK, ME, renderAt } from '../test/fixtures'
import { mockFetch } from '../test/mockApi'

const PRED = (category: string, probability: number | null = null) => ({
  status: 200,
  body: {
    category,
    probability,
    probability_display_supported: probability !== null,
    threshold: 0.07,
    model_version: '0.1.0',
    disclaimer: 'x',
  },
})

async function fill(overrides: Record<string, string> = {}) {
  const u = userEvent.setup()
  const v = { age: '67', glucose: '228.7', bmi: '36.6', ...overrides }
  await u.type(await screen.findByLabelText(/^age \(years\)/i), v.age)
  await u.selectOptions(screen.getByLabelText(/^gender/i), 'Male')
  await u.selectOptions(screen.getByLabelText(/^ever married/i), 'Yes')
  await u.selectOptions(screen.getByLabelText(/^residence type/i), 'Urban')
  await u.selectOptions(screen.getByLabelText(/^work type/i), 'Private')
  await u.click(within(screen.getByRole('group', { name: /high blood pressure/i })).getByLabelText('No'))
  await u.click(within(screen.getByRole('group', { name: /heart disease/i })).getByLabelText('Yes'))
  await u.type(screen.getByLabelText(/^average glucose/i), v.glucose)
  await u.type(screen.getByLabelText(/^bmi/i), v.bmi)
  await u.selectOptions(screen.getByLabelText(/^smoking status/i), 'formerly smoked')
  return u
}

describe('assessment form', () => {
  it('shows inline errors and does not call the server when empty', async () => {
    const { calls } = mockFetch({ 'GET /users/me': ME, 'GET /health': HEALTH_OK })
    renderAt('/assess')
    const u = userEvent.setup()
    await u.click(await screen.findByRole('button', { name: /get result without saving/i }))
    expect((await screen.findAllByRole('alert')).length).toBeGreaterThanOrEqual(5)
    expect(screen.getByText(/enter age/i)).toBeInTheDocument()
    expect(calls.some((c) => c.key.startsWith('POST'))).toBe(false)
  })

  it('rejects out-of-range values with the unit in the message', async () => {
    mockFetch({ 'GET /users/me': ME, 'GET /health': HEALTH_OK })
    renderAt('/assess')
    const u = await fill({ age: '130', glucose: '20', bmi: '90' })
    await u.click(screen.getByRole('button', { name: /get result without saving/i }))
    expect(await screen.findByText(/age must be at most 120 years/i)).toBeInTheDocument()
    expect(screen.getByText(/average glucose must be at least 40 mg\/dL/i)).toBeInTheDocument()
    expect(screen.getByText(/bmi must be at most 80 kg\/m²/i)).toBeInTheDocument()
  })

  it('requires consent before saving and sends nothing without it', async () => {
    const { calls } = mockFetch({ 'GET /users/me': ME, 'GET /health': HEALTH_OK })
    renderAt('/assess')
    const u = await fill()
    await u.click(screen.getByRole('button', { name: /save and get result/i }))
    expect(await screen.findByText(/tick the consent box/i)).toBeInTheDocument()
    expect(calls.some((c) => c.key === 'POST /assessments' || c.key === 'POST /predictions')).toBe(false)
  })

  it('gets a result without saving via the stateless endpoint', async () => {
    const { calls } = mockFetch({
      'GET /users/me': ME,
      'GET /health': HEALTH_OK,
      'POST /predictions': PRED('higher', 0.131),
      'POST /predictions/explain': EXPLAIN_ROUTE,
    })
    renderAt('/assess')
    const u = await fill()
    await u.click(screen.getByRole('button', { name: /get result without saving/i }))
    expect(await screen.findByRole('heading', { name: 'Higher stroke risk' })).toBeInTheDocument()
    expect(screen.getByText(/this result was not saved/i)).toBeInTheDocument()
    expect(calls.some((c) => c.key === 'POST /assessments')).toBe(false)
    expect(calls.find((c) => c.key === 'POST /predictions')?.body).toMatchObject({
      age: 67,
      hypertension: 0,
      heart_disease: 1,
      bmi: 36.6,
    })
  })

  it('saves with consent and sends consent: true', async () => {
    const { calls } = mockFetch({
      'GET /users/me': ME,
      'GET /health': HEALTH_OK,
      'POST /assessments': { status: 201, body: { ...PRED('lower', 0.01).body, id: 5 } },
      'POST /predictions/explain': EXPLAIN_ROUTE,
    })
    renderAt('/assess')
    const u = await fill()
    await u.click(screen.getByRole('checkbox'))
    await u.click(screen.getByRole('button', { name: /save and get result/i }))
    expect(await screen.findByText(/this result was saved to your history/i)).toBeInTheDocument()
    expect(calls.find((c) => c.key === 'POST /assessments')?.body).toMatchObject({
      consent: true,
      inputs: { age: 67 },
    })
  })

  it('shows setup instructions when the model is not trained', async () => {
    mockFetch({
      'GET /users/me': ME,
      'GET /health': {
        status: 200,
        body: { status: 'ok', model_loaded: false, model_message: 'Model not trained yet.' },
      },
    })
    renderAt('/assess')
    expect(await screen.findByRole('heading', { name: /model not trained yet/i })).toBeInTheDocument()
    expect(screen.getByText(/train\.ps1/)).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /get result/i })).not.toBeInTheDocument()
  })

  it('switches to the setup state when the server answers 503 on submit', async () => {
    mockFetch({
      'GET /users/me': ME,
      'GET /health': HEALTH_OK,
      'POST /predictions': {
        status: 503,
        body: { error: { code: 'model_unavailable', message: 'Model not trained yet.', details: null } },
      },
    })
    renderAt('/assess')
    const u = await fill()
    await u.click(screen.getByRole('button', { name: /get result without saving/i }))
    await waitFor(() =>
      expect(screen.getByRole('heading', { name: /model not trained yet/i })).toBeInTheDocument(),
    )
  })

  it('returns to the form when the result page is opened directly', async () => {
    mockFetch({ 'GET /users/me': ME, 'GET /health': HEALTH_OK })
    renderAt('/result')
    expect(await screen.findByRole('heading', { name: /new assessment/i })).toBeInTheDocument()
  })
})
