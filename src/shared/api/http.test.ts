import { describe, it, expect, vi, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { z } from 'zod'
import { request, requestPage } from './http'
import { useTokenStore } from '@/stores/token'

vi.mock('@/router', () => ({
  default: { push: vi.fn<(to: string) => void>() },
}))

import router from '@/router'

const schema = z.object({ symbol: z.string() })

function jsonResponse(status: number, body: unknown) {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: () => Promise.resolve(body),
    text: () => Promise.resolve(JSON.stringify(body)),
  } as Response
}

describe('request', () => {
  beforeEach(() => {
    sessionStorage.clear()
    setActivePinia(createPinia())
    vi.stubGlobal('fetch', vi.fn())
    vi.mocked(router.push).mockClear()
    vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  it('injects the Authorization header from the token store', async () => {
    useTokenStore().token = 'store-token'
    vi.mocked(fetch).mockResolvedValue(jsonResponse(200, { data: { symbol: 'AGENT' } }))

    await request('/my/agent', schema)

    expect(fetch).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({ headers: { Authorization: 'Bearer store-token' } }),
    )
  })

  it('lets options.token override the store token', async () => {
    useTokenStore().token = 'store-token'
    vi.mocked(fetch).mockResolvedValue(jsonResponse(200, { data: { symbol: 'AGENT' } }))

    await request('/my/agent', schema, { token: 'override-token' })

    expect(fetch).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({ headers: { Authorization: 'Bearer override-token' } }),
    )
  })

  it('sends no Authorization header when there is no token anywhere', async () => {
    vi.mocked(fetch).mockResolvedValue(jsonResponse(200, { data: { symbol: 'AGENT' } }))

    await request('/my/agent', schema)

    expect(fetch).toHaveBeenCalledWith(expect.any(String), expect.objectContaining({ headers: {} }))
  })

  it('redirects to /login on 401 and throws', async () => {
    vi.mocked(fetch).mockResolvedValue(jsonResponse(401, {}))

    await expect(request('/my/agent', schema)).rejects.toThrow('Request failed')

    expect(router.push).toHaveBeenCalledWith('/login')
  })

  it('clears the stored token on a 401 when the store token was used', async () => {
    const tokenStore = useTokenStore()
    tokenStore.login('store-token')
    vi.mocked(fetch).mockResolvedValue(jsonResponse(401, {}))

    await expect(request('/my/agent', schema)).rejects.toThrow('Request failed')

    expect(tokenStore.token).toBeNull()
    expect(sessionStorage.getItem('token')).toBeNull()
  })

  it('does not clear the stored token on a 401 for an explicit token override', async () => {
    const tokenStore = useTokenStore()
    tokenStore.login('store-token')
    vi.mocked(fetch).mockResolvedValue(jsonResponse(401, {}))

    await expect(
      request('/my/agent', schema, { token: 'override-token', skipAuthRedirect: true }),
    ).rejects.toThrow('Request failed')

    expect(tokenStore.token).toBe('store-token')
  })

  it('does not redirect on 401 when skipAuthRedirect is set', async () => {
    vi.mocked(fetch).mockResolvedValue(jsonResponse(401, {}))

    await expect(request('/my/agent', schema, { skipAuthRedirect: true })).rejects.toThrow(
      'Request failed',
    )

    expect(router.push).not.toHaveBeenCalled()
  })

  it('returns the parsed data on a successful response', async () => {
    vi.mocked(fetch).mockResolvedValue(jsonResponse(200, { data: { symbol: 'AGENT' } }))

    const result = await request('/my/agent', schema)

    expect(result).toEqual({ symbol: 'AGENT' })
  })

  it('logs and throws on a failed schema parse', async () => {
    vi.mocked(fetch).mockResolvedValue(jsonResponse(200, { data: { symbol: 42 } }))

    await expect(request('/my/agent', schema)).rejects.toThrow('Request failed')

    expect(console.error).toHaveBeenCalled()
  })

  it('logs and throws on a non-401 error response', async () => {
    vi.mocked(fetch).mockResolvedValue(jsonResponse(500, { error: 'boom' }))

    await expect(request('/my/agent', schema)).rejects.toThrow('Request failed')

    expect(console.error).toHaveBeenCalled()
    expect(router.push).not.toHaveBeenCalled()
  })
})

describe('requestPage', () => {
  beforeEach(() => {
    sessionStorage.clear()
    setActivePinia(createPinia())
    vi.stubGlobal('fetch', vi.fn())
    vi.mocked(router.push).mockClear()
    vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  it('omits query params when none are given', async () => {
    vi.mocked(fetch).mockResolvedValue(
      jsonResponse(200, { data: [{ symbol: 'A' }], meta: { total: 1, page: 1, limit: 20 } }),
    )

    await requestPage('/systems', schema)

    expect(fetch).toHaveBeenCalledWith(expect.stringMatching(/\/systems$/), expect.anything())
  })

  it('appends page and limit as query params when given', async () => {
    vi.mocked(fetch).mockResolvedValue(
      jsonResponse(200, { data: [{ symbol: 'A' }], meta: { total: 1, page: 2, limit: 10 } }),
    )

    await requestPage('/systems', schema, { page: 2, limit: 10 })

    expect(fetch).toHaveBeenCalledWith(
      expect.stringMatching(/\/systems\?page=2&limit=10$/),
      expect.anything(),
    )
  })

  it('returns the validated items and pagination meta', async () => {
    vi.mocked(fetch).mockResolvedValue(
      jsonResponse(200, { data: [{ symbol: 'A' }], meta: { total: 1, page: 1, limit: 20 } }),
    )

    const result = await requestPage('/systems', schema)

    expect(result).toEqual({ data: [{ symbol: 'A' }], meta: { total: 1, page: 1, limit: 20 } })
  })

  it('logs and throws when an item fails schema validation', async () => {
    vi.mocked(fetch).mockResolvedValue(
      jsonResponse(200, { data: [{ symbol: 42 }], meta: { total: 1, page: 1, limit: 20 } }),
    )

    await expect(requestPage('/systems', schema)).rejects.toThrow('Request failed')

    expect(console.error).toHaveBeenCalled()
  })

  it('still redirects to /login on a 401', async () => {
    vi.mocked(fetch).mockResolvedValue(jsonResponse(401, {}))

    await expect(requestPage('/systems', schema)).rejects.toThrow('Request failed')

    expect(router.push).toHaveBeenCalledWith('/login')
  })
})
