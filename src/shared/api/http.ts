import { z } from 'zod'
import router from '@/router'
import { useTokenStore } from '@/stores/token'

export interface RequestOptions {
  token?: string
  skipAuthRedirect?: boolean
}

async function fetchJson(url: string, options?: RequestOptions): Promise<unknown> {
  const tokenStore = useTokenStore()
  const token = options?.token ?? tokenStore.token
  const headers: Record<string, string> = {}
  if (token) {
    headers.Authorization = `Bearer ${token}`
  }

  const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}${url}`, { headers })

  if (!response.ok) {
    if (response.status === 401) {
      if (!options?.token) {
        tokenStore.logout()
      }
      if (!options?.skipAuthRedirect) {
        router.push('/login')
      }
    } else {
      console.error(
        `Request to ${url} failed with status ${response.status}`,
        await response.text(),
      )
    }
    throw new Error('Request failed')
  }

  return response.json()
}

export async function request<T>(
  url: string,
  schema: z.ZodType<T>,
  options?: RequestOptions,
): Promise<T> {
  const body = await fetchJson(url, options)
  const result = z.object({ data: schema }).safeParse(body)

  if (!result.success) {
    console.error(result.error.format())
    throw new Error('Request failed')
  }

  return result.data.data
}

export interface PageOptions extends RequestOptions {
  page?: number
  limit?: number
}

const pageMetaSchema = z.object({
  total: z.number(),
  page: z.number(),
  limit: z.number(),
})

export async function requestPage<T>(
  url: string,
  itemSchema: z.ZodType<T>,
  options?: PageOptions,
): Promise<{ data: T[]; meta: z.infer<typeof pageMetaSchema> }> {
  const params = new URLSearchParams()
  if (options?.page !== undefined) params.set('page', String(options.page))
  if (options?.limit !== undefined) params.set('limit', String(options.limit))
  const queryString = params.toString()

  const body = await fetchJson(`${url}${queryString ? `?${queryString}` : ''}`, options)
  const result = z.object({ data: z.array(itemSchema), meta: pageMetaSchema }).safeParse(body)

  if (!result.success) {
    console.error(result.error.format())
    throw new Error('Request failed')
  }

  return result.data
}
