import { describe, it, expect, vi, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { z } from 'zod'
import { request, requestPage, mutate } from './http'
import { useTokenStore } from '@/stores/token'

const schema = z.object({ symbol: z.string() })

function jsonResponse(status: number, body: unknown, headers: Record<string, string> = {}) {
  return {
    ok: status >= 200 && status < 300,
    status,
    headers: new Headers(headers),
    json: () => Promise.resolve(body),
    text: () => Promise.resolve(JSON.stringify(body)),
  } as Response
}

function invalidJsonResponse(status: number) {
  return {
    ok: status >= 200 && status < 300,
    status,
    headers: new Headers(),
    json: () => Promise.reject(new SyntaxError('Unexpected end of JSON input')),
    text: () => Promise.resolve('not json'),
  } as Response
}

describe('request', () => {
  beforeEach(() => {
    sessionStorage.clear()
    setActivePinia(createPinia())
    vi.stubGlobal('fetch', vi.fn())
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

  it('returns the parsed data on a successful response', async () => {
    vi.mocked(fetch).mockResolvedValue(jsonResponse(200, { data: { symbol: 'AGENT' } }))

    const result = await request('/my/agent', schema)

    expect(result).toEqual({ symbol: 'AGENT' })
  })

  it('throws an ApiError with kind "network" when fetch itself rejects', async () => {
    vi.mocked(fetch).mockRejectedValue(new TypeError('Failed to fetch'))

    await expect(request('/my/agent', schema)).rejects.toMatchObject({
      kind: 'network',
      status: null,
    })
  })

  it('throws an ApiError with kind "invalid-response" when a 2xx body is not valid JSON', async () => {
    vi.mocked(fetch).mockResolvedValue(invalidJsonResponse(200))

    await expect(request('/my/agent', schema)).rejects.toMatchObject({
      kind: 'invalid-response',
      status: 200,
    })
  })

  it.each([
    [401, 'auth'],
    [404, 'not-found'],
    [400, 'client'],
    [500, 'server'],
  ] as const)('maps a %i response to ApiError kind "%s"', async (status, kind) => {
    vi.mocked(fetch).mockResolvedValue(jsonResponse(status, {}))

    await expect(request('/my/agent', schema)).rejects.toMatchObject({ kind, status })
    expect(console.error).toHaveBeenCalled()
  })

  it('throws an ApiError with kind "rate-limit", status 429, and retryAfterMs from the header', async () => {
    vi.mocked(fetch).mockResolvedValue(jsonResponse(429, {}, { 'Retry-After': '2' }))

    await expect(request('/my/agent', schema)).rejects.toMatchObject({
      kind: 'rate-limit',
      status: 429,
      retryAfterMs: 2000,
    })
  })

  it('leaves retryAfterMs undefined when the 429 has no Retry-After header', async () => {
    vi.mocked(fetch).mockResolvedValue(jsonResponse(429, {}))

    await expect(request('/my/agent', schema)).rejects.toMatchObject({
      kind: 'rate-limit',
      retryAfterMs: undefined,
    })
  })

  it('throws an ApiError with kind "invalid-response" on a failed schema parse', async () => {
    vi.mocked(fetch).mockResolvedValue(jsonResponse(200, { data: { symbol: 42 } }))

    await expect(request('/my/agent', schema)).rejects.toMatchObject({
      kind: 'invalid-response',
    })

    expect(console.error).toHaveBeenCalled()
  })
})

describe('requestPage', () => {
  beforeEach(() => {
    sessionStorage.clear()
    setActivePinia(createPinia())
    vi.stubGlobal('fetch', vi.fn())
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

  it('throws an ApiError with kind "invalid-response" when an item fails schema validation', async () => {
    vi.mocked(fetch).mockResolvedValue(
      jsonResponse(200, { data: [{ symbol: 42 }], meta: { total: 1, page: 1, limit: 20 } }),
    )

    await expect(requestPage('/systems', schema)).rejects.toMatchObject({
      kind: 'invalid-response',
    })

    expect(console.error).toHaveBeenCalled()
  })

  it('throws an ApiError with kind "auth" on a 401', async () => {
    vi.mocked(fetch).mockResolvedValue(jsonResponse(401, {}))

    await expect(requestPage('/systems', schema)).rejects.toMatchObject({
      kind: 'auth',
      status: 401,
    })
  })
})

describe('mutate', () => {
  beforeEach(() => {
    sessionStorage.clear()
    setActivePinia(createPinia())
    vi.stubGlobal('fetch', vi.fn())
    vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  it('sends a POST request without a body and without Content-Type header', async () => {
    useTokenStore().token = 'store-token'
    vi.mocked(fetch).mockResolvedValue(jsonResponse(200, { data: { symbol: 'AGENT' } }))

    await mutate('/my/ships/SHIP-1/orbit', schema, { method: 'POST' })

    expect(fetch).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        method: 'POST',
        headers: {
          Authorization: 'Bearer store-token',
        },
      }),
    )
  })

  it('sends Content-Type: application/json header when body is provided', async () => {
    vi.mocked(fetch).mockResolvedValue(jsonResponse(200, { data: { symbol: 'AGENT' } }))

    await mutate('/my/ships/SHIP-1/navigate', schema, {
      method: 'POST',
      body: { waypointSymbol: 'X1-DF55-20250Z' },
    })

    expect(fetch).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          'Content-Type': 'application/json',
        }),
      }),
    )
  })

  it('serializes the body with JSON.stringify when body is provided', async () => {
    vi.mocked(fetch).mockResolvedValue(jsonResponse(200, { data: { symbol: 'AGENT' } }))

    await mutate('/my/ships/SHIP-1/navigate', schema, {
      method: 'POST',
      body: { waypointSymbol: 'X1-A1' },
    })

    expect(fetch).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ waypointSymbol: 'X1-A1' }),
      }),
    )
  })

  it('omits body when not provided', async () => {
    vi.mocked(fetch).mockResolvedValue(jsonResponse(200, { data: { symbol: 'AGENT' } }))

    await mutate('/my/ships/SHIP-1/orbit', schema, { method: 'POST' })

    expect(fetch).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        method: 'POST',
        body: undefined,
      }),
    )
  })

  it('supports PATCH and PUT methods', async () => {
    vi.mocked(fetch).mockResolvedValue(jsonResponse(200, { data: { symbol: 'AGENT' } }))

    await mutate('/my/ships/SHIP-1', schema, { method: 'PATCH' })
    expect(fetch).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({ method: 'PATCH' }),
    )

    await mutate('/my/ships/SHIP-1', schema, { method: 'PUT' })
    expect(fetch).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({ method: 'PUT' }),
    )
  })

  it('returns the parsed data on a successful response', async () => {
    vi.mocked(fetch).mockResolvedValue(jsonResponse(200, { data: { symbol: 'AGENT' } }))

    const result = await mutate('/my/ships/SHIP-1/orbit', schema, { method: 'POST' })

    expect(result).toEqual({ symbol: 'AGENT' })
  })

  it('throws an ApiError with kind "client" on a 400 response', async () => {
    vi.mocked(fetch).mockResolvedValue(jsonResponse(400, {}))

    await expect(
      mutate('/my/ships/SHIP-1/orbit', schema, { method: 'POST' }),
    ).rejects.toMatchObject({
      kind: 'client',
      status: 400,
    })
  })

  it('throws an ApiError with kind "network" when fetch itself rejects', async () => {
    vi.mocked(fetch).mockRejectedValue(new TypeError('Failed to fetch'))

    await expect(
      mutate('/my/ships/SHIP-1/orbit', schema, { method: 'POST' }),
    ).rejects.toMatchObject({
      kind: 'network',
      status: null,
    })
  })
})
