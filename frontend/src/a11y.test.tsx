// Automated accessibility scan (axe-core) of every page, rendered with mocked API data.
// Limits: jsdom has no layout engine, so colour contrast is checked separately by scripts/contrast_check.py.
import { render, screen, waitFor } from '@testing-library/react'
import axe from 'axe-core'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import { ResultView } from './components/ResultView'
import { HEALTH_OK, INPUT, ME, METADATA, METRICS, assessment, renderAt } from './test/fixtures'
import { mockFetch, notTrained, signedOut, type Routes } from './test/mockApi'

async function scan(container: HTMLElement) {
  const results = await axe.run(container, {
    rules: { 'color-contrast': { enabled: false }, region: { enabled: false } },
    runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'best-practice'] },
  })
  return results.violations.map(
    (v) =>
      `${v.id} (${v.impact}): ${v.help} -> ${v.nodes
        .slice(0, 2)
        .map((n) => n.html.slice(0, 120))
        .join(' | ')}`,
  )
}

const page = (items: ReturnType<typeof assessment>[], total = items.length, limit = 10) => ({
  status: 200,
  body: { items, total, limit, offset: 0 },
})
const FI = {
  status: 200,
  body: {
    method: 'permutation importance',
    importances: [{ feature: 'age', mean: 0.19, std: 0.01 }],
    limitations: ['Not causal.'],
  },
}
const authed: Routes = { 'GET /users/me': ME, 'GET /health': HEALTH_OK }

async function check(path: string, routes: Routes, ready: RegExp | { name: RegExp; level?: number }) {
  mockFetch(routes)
  const { container } = renderAt(path)
  if (ready instanceof RegExp) await screen.findAllByText(ready)
  else await screen.findByRole('heading', { name: ready.name, level: ready.level })
  await new Promise((r) => setTimeout(r, 50)) // let late fetches settle
  expect(await scan(container)).toEqual([])
}

describe('axe: no violations on any page', () => {
  it('landing (model not trained)', () =>
    check('/', { ...signedOut, ...notTrained }, { name: /explore stroke risk factors/i, level: 1 }))
  it('landing (with real metrics)', () =>
    check('/', { ...signedOut, 'GET /model/metrics': { status: 200, body: METRICS } }, /^80?\.?|82\.0%/))
  it('login', () => check('/login', signedOut, { name: /^sign in$/i }))
  it('register', () => check('/register', signedOut, { name: /create your account/i }))
  it('404', () => check('/nope', signedOut, { name: /page not found/i }))
  it('methodology', () =>
    check(
      '/methodology',
      {
        ...signedOut,
        'GET /model/metadata': { status: 200, body: METADATA },
        'GET /model/metrics': { status: 200, body: METRICS },
      },
      { name: /privacy and data handling/i },
    ))
  it('assessment form', () => check('/assess', authed, { name: /new assessment/i }))
  it('dashboard (with data)', () =>
    check(
      '/dashboard',
      {
        ...authed,
        'GET /assessments?limit=100&offset=0': page(
          [assessment(2, 'higher'), assessment(1, 'lower')],
          2,
          100,
        ),
      },
      { name: /welcome/i },
    ))
  it('dashboard (empty)', () =>
    check(
      '/dashboard',
      { ...authed, 'GET /assessments?limit=100&offset=0': page([], 0, 100) },
      /no saved assessments yet/i,
    ))
  it('history', () =>
    check(
      '/history',
      {
        ...authed,
        'GET /assessments?limit=10&offset=0': page([assessment(2, 'higher'), assessment(1, 'lower')]),
      },
      { name: /^history$/i },
    ))
  it('history detail', () =>
    check(
      '/history/4',
      {
        ...authed,
        'GET /assessments/4': { status: 200, body: assessment(4, 'higher') },
        'GET /model/metrics': { status: 200, body: METRICS },
      },
      { name: /higher than typical/i },
    ))
  it('analytics', () =>
    check(
      '/analytics',
      {
        ...authed,
        'GET /model/metrics': { status: 200, body: METRICS },
        'GET /model/feature-importance': FI,
      },
      { name: /model analytics/i },
    ))
  it('settings', () => check('/settings', authed, { name: /profile and settings/i }))

  it('result (each band)', async () => {
    for (const category of ['lower', 'moderate', 'higher'] as const) {
      const { container, unmount } = render(
        <MemoryRouter>
          <ResultView
            data={{
              category,
              probability: 0.1,
              inputs: INPUT,
              threshold: 0.07,
              modelVersion: '0.1.0',
              saved: true,
            }}
          />
        </MemoryRouter>,
      )
      expect(await scan(container)).toEqual([])
      unmount()
    }
  })

  it('every page has exactly one main landmark with a skip link target', async () => {
    mockFetch({ ...signedOut, ...notTrained })
    const { container } = renderAt('/')
    await screen.findByRole('heading', { level: 1 })
    await waitFor(() => expect(container.querySelectorAll('main#main').length).toBe(1))
    expect(screen.getByRole('link', { name: /skip to main content/i })).toHaveAttribute('href', '#main')
  })
})
