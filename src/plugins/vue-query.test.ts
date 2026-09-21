import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createApp } from 'vue'
import { VueQueryPlugin, useQuery, useMutation } from '@tanstack/vue-query'
import { setActivePinia, createPinia } from 'pinia'
import { z } from 'zod'
import { queryClient, shouldRetry, retryDelay } from './vue-query'
import { request, mutate } from '@/shared/api/http'
import { useTokenStore } from '@/stores/token'
import { ApiError } from '@/shared/api/api-error'
import { STALE_TIME } from '@/shared/api/query-config'
import router from '@/router'

describe('shouldRetry', () => {
  it.each([
    ['network', true],
    ['server', true],
    ['rate-limit', true],
    ['auth', false],
    ['not-found', false],
    ['client', false],
    ['invalid-response', false],
  ] as const)('for an ApiError of kind "%s", retries: %s', (kind, expected) => {
    const error = new ApiError(kind, null, 'boom')

    expect(shouldRetry(0, error)).toBe(expected)
  })

  it('stops retrying once the failure count reaches the max (3)', () => {
    const error = new ApiError('network', null, 'boom')

    expect(shouldRetry(2, error)).toBe(true)
    expect(shouldRetry(3, error)).toBe(false)
  })

  it('never retries a non-ApiError', () => {
    expect(shouldRetry(0, new Error('boom'))).toBe(false)
  })
})

describe('retryDelay', () => {
  it.each([
    [0, 'server', undefined, 1000],
    [1, 'server', undefined, 2000],
    [2, 'server', undefined, 4000],
    [0, 'rate-limit', undefined, 1000],
    [0, 'rate-limit', 2000, 2000],
  ] as const)(
    'failureCount %i, kind "%s", retryAfterMs %s -> %ims',
    (failureCount, kind, retryAfterMs, expected) => {
      const error = new ApiError(kind, null, 'boom', retryAfterMs)

      expect(retryDelay(failureCount, error)).toBe(expected)
    },
  )
})

describe('queryClient: default options', () => {
  it('sets the default staleTime to STALE_TIME.default', () => {
    expect(queryClient.getDefaultOptions().queries?.staleTime).toBe(STALE_TIME.default)
  })
})

describe('queryClient: 401 handling via the real QueryCache', () => {
  const schema = z.object({ symbol: z.string() })

  function jsonResponse(status: number, body: unknown) {
    return {
      ok: status >= 200 && status < 300,
      status,
      headers: new Headers(),
      json: () => Promise.resolve(body),
      text: () => Promise.resolve(JSON.stringify(body)),
    } as Response
  }

  function withQueryClient<T>(fn: () => T): T {
    const app = createApp({})
    app.use(VueQueryPlugin, { queryClient })
    return app.runWithContext(fn)
  }

  beforeEach(async () => {
    sessionStorage.clear()
    setActivePinia(createPinia())
    vi.stubGlobal('fetch', vi.fn())
    vi.spyOn(console, 'error').mockImplementation(() => {})
    queryClient.clear()
    useTokenStore().login('store-token')
    await router.push('/')
    await router.isReady()
  })

  it('logs out and redirects to /login when a real useQuery hits a 401', async () => {
    vi.mocked(fetch).mockResolvedValue(jsonResponse(401, {}))

    const query = withQueryClient(() =>
      useQuery({ queryKey: ['auth-redirect-test'], queryFn: () => request('/my/agent', schema) }),
    )

    await vi.waitFor(() => expect(query.isError.value).toBe(true))
    await vi.waitFor(() => expect(router.currentRoute.value.path).toBe('/login'))
    expect(useTokenStore().token).toBeNull()
  })

  it('logs out and redirects to /login when a real useMutation hits a 401', async () => {
    vi.mocked(fetch).mockResolvedValue(jsonResponse(401, {}))

    const mutation = withQueryClient(() =>
      useMutation({
        mutationFn: () => mutate('/my/ships/SHIP-1/orbit', schema, { method: 'POST' }),
      }),
    )
    mutation.mutate()

    await vi.waitFor(() => expect(mutation.isError.value).toBe(true))
    await vi.waitFor(() => expect(router.currentRoute.value.path).toBe('/login'))
    expect(useTokenStore().token).toBeNull()
  })
})
