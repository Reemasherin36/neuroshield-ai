import { describe, expect, it, vi } from 'vitest'
import { api, ApiError } from './api'
import { mockFetch } from '../test/mockApi'

describe('api client', () => {
  it('normalises the backend error format into ApiError', async () => {
    mockFetch({
      'POST /predictions': {
        status: 422,
        body: {
          error: {
            code: 'validation_error',
            message: 'Invalid input.',
            details: [{ field: 'body.age', message: 'too big' }],
          },
        },
      },
    })
    const err = await api.predict({} as never).catch((e: unknown) => e)
    expect(err).toBeInstanceOf(ApiError)
    expect((err as ApiError).status).toBe(422)
    expect((err as ApiError).code).toBe('validation_error')
    expect((err as ApiError).details?.[0].field).toBe('body.age')
  })

  it('reports a network failure as status 0', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('Failed to fetch')))
    const err = (await api.health().catch((e: unknown) => e)) as ApiError
    expect(err.isNetwork).toBe(true)
    expect(err.code).toBe('network_error')
  })

  it('returns undefined for 204 responses and sends credentials', async () => {
    const { fn } = mockFetch({ 'POST /auth/logout': { status: 204 } })
    await expect(api.auth.logout()).resolves.toBeUndefined()
    expect(fn.mock.calls[0][1]?.credentials).toBe('include')
  })

  it('notifies listeners on an expired session', async () => {
    const { onUnauthorized } = await import('./api')
    const cb = vi.fn()
    const off = onUnauthorized(cb)
    mockFetch({
      'GET /users/me': {
        status: 401,
        body: { error: { code: 'not_authenticated', message: 'x', details: null } },
      },
    })
    await api.users.me().catch(() => undefined)
    expect(cb).toHaveBeenCalledOnce()
    off()
  })
})
