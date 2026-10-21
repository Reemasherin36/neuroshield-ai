import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { EXPLAIN_ROUTE, HEALTH_OK, ME, METADATA, METRICS, assessment, renderAt } from '../test/fixtures'
import { mockFetch } from '../test/mockApi'

const page = (items: ReturnType<typeof assessment>[], total = items.length, limit = 10) => ({
  status: 200,
  body: { items, total, limit, offset: 0 },
})
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
    expect(await screen.findByText(/lower stroke risk:/i)).toBeInTheDocument()
    const dist = screen.getByRole('region', { name: /your saved results/i })
    expect(within(dist).getByText(/lower stroke risk:/i).parentElement).toHaveTextContent(
      'Lower stroke risk: 2',
    )
    expect(within(dist).getByText(/higher stroke risk:/i).parentElement).toHaveTextContent(
      'Higher stroke risk: 1',
    )
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
    expect(screen.queryByText(/your saved results/i)).not.toBeInTheDocument()
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
    expect(await screen.findByText(/higher stroke risk/i)).toBeInTheDocument()
    await u.click(screen.getAllByRole('button', { name: /^delete$/i })[0])
    expect(calls.some((c) => c.key === 'DELETE /assessments/2')).toBe(false) // first click only asks
    await u.click(screen.getByRole('button', { name: /confirm delete/i }))
    await waitFor(() => expect(screen.queryByText(/higher stroke risk/i)).not.toBeInTheDocument())
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
      'POST /predictions/explain': EXPLAIN_ROUTE,
      'GET /model/metrics': { status: 200, body: { ...METRICS, probability_display_supported: false } },
    })
    renderAt('/history/4')
    expect(await screen.findByRole('heading', { name: 'Lower stroke risk' })).toBeInTheDocument()
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
    expect(await screen.findByRole('heading', { level: 1, name: /higher or lower/i })).toBeInTheDocument()
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

describe('analytics (personal risk analysis)', () => {
  it('shows the verdict, the percentage and which answers drive it, from the latest saved assessment', async () => {
    mockFetch({
      'GET /users/me': ME,
      'GET /assessments?limit=1&offset=0': page([assessment(3, 'higher')], 1, 1),
      'POST /predictions/explain': EXPLAIN_ROUTE,
    })
    renderAt('/analytics')
    expect(await screen.findByRole('heading', { level: 1, name: /your risk analysis/i })).toBeInTheDocument()
    expect(await screen.findByRole('heading', { name: 'Higher stroke risk' })).toBeInTheDocument()
    expect(screen.getByText(/estimated stroke risk:/i)).toHaveTextContent('13%')
    const up = await screen.findByRole('heading', { name: /pushing your estimate up/i })
    expect(within(up.nextElementSibling as HTMLElement).getAllByRole('listitem')[0]).toHaveTextContent(
      /age.*\+11\.2 points/i,
    )
    expect(screen.getByRole('link', { name: /open the full result/i })).toHaveAttribute('href', '/history/3')
  })

  it('shows no model-quality plots or numbers', async () => {
    mockFetch({
      'GET /users/me': ME,
      'GET /assessments?limit=1&offset=0': page([assessment(3, 'lower')], 1, 1),
      'POST /predictions/explain': EXPLAIN_ROUTE,
    })
    renderAt('/analytics')
    await screen.findByRole('heading', { name: /pushing your estimate up/i })
    expect(document.body.textContent).not.toMatch(
      /ROC|PR-AUC|precision|recall|confusion matrix|calibration|Brier/i,
    )
  })

  it('asks the user to complete an assessment when none is saved', async () => {
    mockFetch({ 'GET /users/me': ME, 'GET /assessments?limit=1&offset=0': page([], 0, 1) })
    renderAt('/analytics')
    expect(await screen.findByText(/no analysis yet/i)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /start new assessment/i })).toHaveAttribute('href', '/assess')
  })

  it('still shows the saved verdict when the breakdown is unavailable', async () => {
    mockFetch({
      'GET /users/me': ME,
      'GET /assessments?limit=1&offset=0': page([assessment(3, 'higher')], 1, 1),
      'POST /predictions/explain': {
        status: 503,
        body: {
          error: { code: 'reference_unavailable', message: 'Run: python -m ml.summarize', details: null },
        },
      },
    })
    renderAt('/analytics')
    expect(await screen.findByText(/python -m ml\.summarize/)).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Higher stroke risk' })).toBeInTheDocument()
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
