import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { HEALTH_OK, ME, METADATA, METRICS, assessment, renderAt } from '../test/fixtures'
import { mockFetch } from '../test/mockApi'

const page = (items: ReturnType<typeof assessment>[], total = items.length, limit = 10) => ({
  status: 200,
  body: { items, total, limit, offset: 0 },
})
const FI = {
  status: 200,
  body: {
    method: 'permutation importance on validation set',
    importances: [{ feature: 'age', mean: 0.19, std: 0.01 }],
    limitations: ['It is not causal and does not show what matters medically.'],
  },
}
const NOT_TRAINED = {
  status: 503,
  body: { error: { code: 'model_unavailable', message: 'Model not trained yet.', details: null } },
}

describe('dashboard', () => {
  it('shows real counts from saved assessments', async () => {
    mockFetch({
      'GET /users/me': ME,
      'GET /health': HEALTH_OK,
      'GET /assessments?limit=100&offset=0': page(
        [assessment(3, 'higher'), assessment(2, 'lower'), assessment(1, 'lower')],
        3,
        100,
      ),
    })
    renderAt('/dashboard')
    expect(await screen.findByText('Lower:')).toBeInTheDocument()
    const dist = screen.getByRole('region', { name: /by band/i })
    expect(within(dist).getByText(/lower:/i).parentElement).toHaveTextContent('Lower: 2')
    expect(within(dist).getByText(/higher:/i).parentElement).toHaveTextContent('Higher: 1')
    expect(screen.getByText('Saved assessments').nextElementSibling).toHaveTextContent('3')
  })

  it('shows the empty state, not invented data, when nothing is saved', async () => {
    mockFetch({
      'GET /users/me': ME,
      'GET /health': HEALTH_OK,
      'GET /assessments?limit=100&offset=0': page([], 0, 100),
    })
    renderAt('/dashboard')
    expect(await screen.findByText(/no saved assessments yet/i)).toBeInTheDocument()
    expect(screen.queryByText(/by band/i)).not.toBeInTheDocument()
  })

  it('tells the user when the model is not trained', async () => {
    mockFetch({
      'GET /users/me': ME,
      'GET /health': {
        status: 200,
        body: { status: 'ok', model_loaded: false, model_message: 'Model not trained yet.' },
      },
      'GET /assessments?limit=100&offset=0': page([], 0, 100),
    })
    renderAt('/dashboard')
    expect((await screen.findAllByText(/model not trained yet/i)).length).toBeGreaterThan(0)
  })
})

describe('history', () => {
  it('lists saved assessments and deletes one after confirmation', async () => {
    let deleted = false
    const { calls } = mockFetch({
      'GET /users/me': ME,
      'GET /assessments?limit=10&offset=0': () =>
        deleted ? page([assessment(1, 'lower')]) : page([assessment(2, 'higher'), assessment(1, 'lower')]),
      'DELETE /assessments/2': () => {
        deleted = true
        return { status: 204 }
      },
    })
    renderAt('/history')
    const u = userEvent.setup()
    expect(await screen.findByText(/higher than typical in the training data/i)).toBeInTheDocument()
    await u.click(screen.getAllByRole('button', { name: /^delete$/i })[0])
    expect(calls.some((c) => c.key === 'DELETE /assessments/2')).toBe(false) // first click only asks
    await u.click(screen.getByRole('button', { name: /confirm delete/i }))
    await waitFor(() =>
      expect(screen.queryByText(/higher than typical in the training data/i)).not.toBeInTheDocument(),
    )
    expect(calls.some((c) => c.key === 'DELETE /assessments/2')).toBe(true)
  })

  it('deletes everything only after a second confirming click', async () => {
    let cleared = false
    const { calls } = mockFetch({
      'GET /users/me': ME,
      'GET /assessments?limit=10&offset=0': () => (cleared ? page([], 0) : page([assessment(1, 'lower')])),
      'DELETE /assessments': () => {
        cleared = true
        return { status: 204 }
      },
    })
    renderAt('/history')
    const u = userEvent.setup()
    await u.click(await screen.findByRole('button', { name: /^delete all$/i }))
    expect(calls.some((c) => c.key === 'DELETE /assessments')).toBe(false)
    await u.click(screen.getByRole('button', { name: /yes, delete all/i }))
    expect(await screen.findByText(/no saved assessments/i)).toBeInTheDocument()
  })

  it('shows the empty state', async () => {
    mockFetch({ 'GET /users/me': ME, 'GET /assessments?limit=10&offset=0': page([], 0) })
    renderAt('/history')
    expect(await screen.findByText(/no saved assessments/i)).toBeInTheDocument()
  })

  it('shows a saved result in detail and hides the percentage when calibration is unsupported', async () => {
    mockFetch({
      'GET /users/me': ME,
      'GET /assessments/4': { status: 200, body: assessment(4, 'moderate') },
      'GET /model/metrics': { status: 200, body: { ...METRICS, probability_display_supported: false } },
    })
    renderAt('/history/4')
    expect(
      await screen.findByRole('heading', { name: /moderate compared with the training data/i }),
    ).toBeInTheDocument()
    expect(screen.queryByText(/approximate model output/i)).not.toBeInTheDocument()
    expect(screen.getByText(/this result was saved to your history/i)).toBeInTheDocument()
  })

  it("shows not found for another user's or deleted record (404)", async () => {
    mockFetch({
      'GET /users/me': ME,
      'GET /assessments/99': {
        status: 404,
        body: { error: { code: 'not_found', message: 'Assessment not found.', details: null } },
      },
      'GET /model/metrics': { status: 200, body: METRICS },
    })
    renderAt('/history/99')
    expect(await screen.findByRole('heading', { name: /assessment not found/i })).toBeInTheDocument()
  })
})

describe('settings', () => {
  it('validates the password change locally', async () => {
    const { calls } = mockFetch({ 'GET /users/me': ME })
    renderAt('/settings')
    const u = userEvent.setup()
    await u.type(await screen.findByLabelText(/^current password/i), 'old-password-1')
    await u.type(screen.getByLabelText(/^new password/i), 'short')
    await u.type(screen.getByLabelText(/confirm new password/i), 'other')
    await u.click(screen.getByRole('button', { name: /change password/i }))
    expect(
      await screen.findByText(/at least 10 characters/i, { selector: '[role="alert"]' }),
    ).toBeInTheDocument()
    expect(screen.getByText(/passwords do not match/i)).toBeInTheDocument()
    expect(calls.some((c) => c.key.startsWith('PATCH'))).toBe(false)
  })

  it('changes the password and reports success', async () => {
    const { calls } = mockFetch({ 'GET /users/me': ME, 'PATCH /users/me/password': { status: 204 } })
    renderAt('/settings')
    const u = userEvent.setup()
    await u.type(await screen.findByLabelText(/^current password/i), 'old-password-1')
    await u.type(screen.getByLabelText(/^new password/i), 'brand-new-pass-1')
    await u.type(screen.getByLabelText(/confirm new password/i), 'brand-new-pass-1')
    await u.click(screen.getByRole('button', { name: /change password/i }))
    expect(await screen.findByText(/password changed/i)).toBeInTheDocument()
    expect(calls.find((c) => c.key.startsWith('PATCH'))?.body).toEqual({
      current_password: 'old-password-1',
      new_password: 'brand-new-pass-1',
    })
  })

  it('shows the server error for a wrong current password', async () => {
    mockFetch({
      'GET /users/me': ME,
      'PATCH /users/me/password': {
        status: 400,
        body: { error: { code: 'wrong_password', message: 'Current password is incorrect.', details: null } },
      },
    })
    renderAt('/settings')
    const u = userEvent.setup()
    await u.type(await screen.findByLabelText(/^current password/i), 'wrong-password-1')
    await u.type(screen.getByLabelText(/^new password/i), 'brand-new-pass-1')
    await u.type(screen.getByLabelText(/confirm new password/i), 'brand-new-pass-1')
    await u.click(screen.getByRole('button', { name: /change password/i }))
    expect(await screen.findByText(/current password is incorrect/i)).toBeInTheDocument()
  })

  it('requires a password to delete the account, then signs out', async () => {
    const { calls } = mockFetch({
      'GET /users/me': ME,
      'DELETE /users/me': { status: 204 },
      'POST /auth/logout': { status: 204 },
      'GET /model/metrics': NOT_TRAINED,
    })
    renderAt('/settings')
    const u = userEvent.setup()
    await u.click(await screen.findByRole('button', { name: /delete my account/i }))
    expect(
      await screen.findByText(/enter your password to confirm/i, { selector: '[role="alert"]' }),
    ).toBeInTheDocument()
    expect(calls.some((c) => c.key === 'DELETE /users/me')).toBe(false)
    await u.type(screen.getByLabelText('Password'), 'my-password-123')
    await u.click(screen.getByRole('button', { name: /delete my account/i }))
    await waitFor(() =>
      expect(calls.find((c) => c.key === 'DELETE /users/me')?.body).toEqual({ password: 'my-password-123' }),
    )
    expect(
      await screen.findByRole('heading', { level: 1, name: /explore stroke risk factors/i }),
    ).toBeInTheDocument()
  })

  it('deletes all saved assessments only after confirmation', async () => {
    const { calls } = mockFetch({ 'GET /users/me': ME, 'DELETE /assessments': { status: 204 } })
    renderAt('/settings')
    const u = userEvent.setup()
    await u.click(await screen.findByRole('button', { name: /delete all saved assessments/i }))
    expect(calls.some((c) => c.key === 'DELETE /assessments')).toBe(false)
    await u.click(screen.getByRole('button', { name: /yes, delete them all/i }))
    expect(await screen.findByText(/all saved assessments were deleted/i)).toBeInTheDocument()
  })
})

describe('analytics', () => {
  it('shows real metrics, the confusion matrix and the feature-importance limitations', async () => {
    mockFetch({
      'GET /users/me': ME,
      'GET /model/metrics': { status: 200, body: METRICS },
      'GET /model/feature-importance': FI,
    })
    renderAt('/analytics')
    expect(await screen.findByRole('heading', { name: /model analytics/i })).toBeInTheDocument()
    const cm = screen.getByRole('table', { name: /confusion matrix/i })
    expect(within(cm).getByText('682')).toBeInTheDocument()
    expect(within(cm).getByText('41')).toBeInTheDocument()
    expect(screen.getByText('82.0%')).toBeInTheDocument()
    expect(screen.getByText(/says nothing about any one person/i)).toBeInTheDocument()
    expect(screen.getByText(/not causal/i)).toBeInTheDocument()
  })

  it('shows the not-trained state instead of charts', async () => {
    mockFetch({
      'GET /users/me': ME,
      'GET /model/metrics': NOT_TRAINED,
      'GET /model/feature-importance': NOT_TRAINED,
    })
    renderAt('/analytics')
    expect(await screen.findByRole('heading', { name: /model not trained yet/i })).toBeInTheDocument()
    expect(screen.queryByText(/roc curve/i)).not.toBeInTheDocument()
  })
})

describe('methodology', () => {
  it('is public and uses real dataset counts', async () => {
    mockFetch({
      'GET /users/me': {
        status: 401,
        body: { error: { code: 'not_authenticated', message: 'x', details: null } },
      },
      'GET /model/metadata': { status: 200, body: METADATA },
      'GET /model/metrics': { status: 200, body: METRICS },
    })
    renderAt('/methodology')
    expect(await screen.findByRole('heading', { level: 1, name: /methodology/i })).toBeInTheDocument()
    expect(await screen.findByText(/201 BMI values were written as the text/i)).toBeInTheDocument()
    expect(screen.getByRole('img', { name: /249 of 5110 people had a recorded stroke/i })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /limitations/i })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /privacy and data handling/i })).toBeInTheDocument()
  })

  it('says numbers are unavailable rather than inventing them when the model is missing', async () => {
    mockFetch({
      'GET /users/me': {
        status: 401,
        body: { error: { code: 'not_authenticated', message: 'x', details: null } },
      },
      'GET /model/metadata': NOT_TRAINED,
      'GET /model/metrics': NOT_TRAINED,
    })
    renderAt('/methodology')
    expect(await screen.findByText(/real numbers are unavailable right now/i)).toBeInTheDocument()
    expect(screen.queryByText(/of 5110/)).not.toBeInTheDocument()
  })
})
