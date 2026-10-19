import { vi } from 'vitest'

type Handler = { status: number; body?: unknown }
export type Routes = Record<string, Handler | (() => Handler)>

/** Stubs fetch. Keys are "METHOD /path" (relative to the API base). Unmatched calls fail the test loudly. */
export function mockFetch(routes: Routes) {
  const calls: { key: string; body: unknown }[] = []
  const fn = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = String(input).replace(/^https?:\/\/[^/]+\/api\/v1/, '')
    const key = `${init?.method ?? 'GET'} ${url}`
    calls.push({ key, body: init?.body ? JSON.parse(String(init.body)) : undefined })
    const h = routes[key]
    if (!h) throw new Error(`Unmocked request: ${key}`)
    const r = typeof h === 'function' ? h() : h
    return new Response(r.status === 204 ? null : JSON.stringify(r.body ?? {}), {
      status: r.status,
      headers: { 'Content-Type': 'application/json' },
    })
  })
  vi.stubGlobal('fetch', fn)
  return { fn, calls }
}

export const signedOut: Routes = {
  'GET /users/me': {
    status: 401,
    body: { error: { code: 'not_authenticated', message: 'Please sign in.', details: null } },
  },
}
export const notTrained: Routes = {
  'GET /model/metrics': {
    status: 503,
    body: { error: { code: 'model_unavailable', message: 'Model not trained yet.', details: null } },
  },
}
