import { describe, it, expect, vi, beforeEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { z } from 'zod'
import { request } from './http'
import { useTokenStore } from '@/stores/token'
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

describe('request with the real router (no vi.mock)', () => {
  beforeEach(async () => {
    sessionStorage.clear()
    setActivePinia(createPinia())
    vi.stubGlobal('fetch', vi.fn())
    vi.spyOn(console, 'error').mockImplementation(() => {})
    useTokenStore().login('store-token')
    await router.push('/')
    await router.isReady()
  })

  it('actually lands on /login after a 401 clears the stored token', async () => {
    vi.mocked(fetch).mockResolvedValue(jsonResponse(401, {}))

    await expect(request('/my/agent', schema)).rejects.toThrow('Request failed')

    await vi.waitFor(() => {
      expect(router.currentRoute.value.path).toBe('/login')
    })
  })
})
