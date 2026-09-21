import { z } from 'zod'
import { useTokenStore } from '@/stores/token'
import { ApiError, type ApiErrorKind } from './api-error'

export interface RequestOptions {
  token?: string
}

export interface MutateOptions extends RequestOptions {
  method: 'POST' | 'PATCH' | 'PUT'
  body?: Record<string, unknown>
}

function statusToKind(status: number): ApiErrorKind {
  if (status === 401) return 'auth'
  if (status === 404) return 'not-found'
  if (status === 429) return 'rate-limit'
  if (status >= 400 && status < 500) return 'client'
  return 'server'
}

function retryAfterMsFromHeader(response: Response): number | undefined {
  const header = response.headers.get('Retry-After')
  if (!header) return undefined
  const seconds = Number(header)
  return Number.isNaN(seconds) ? undefined : seconds * 1000
}

interface FetchJsonOptions extends RequestOptions {
  method?: 'GET' | 'POST' | 'PATCH' | 'PUT'
  body?: Record<string, unknown>
}

async function fetchJson(url: string, options?: FetchJsonOptions): Promise<unknown> {
  const tokenStore = useTokenStore()
  const token = options?.token ?? tokenStore.token
  const headers: Record<string, string> = {}

  if (options?.body) {
    headers['Content-Type'] = 'application/json'
  }

  if (token) {
    headers.Authorization = `Bearer ${token}`
  }

  let response: Response
  try {
    response = await fetch(`${import.meta.env.VITE_API_BASE_URL}${url}`, {
      method: options?.method,
      headers,
      body: options?.body ? JSON.stringify(options.body) : undefined,
    })
  } catch {
    throw new ApiError('network', null, 'Network request failed')
  }

  if (!response.ok) {
    const kind = statusToKind(response.status)
    const retryAfterMs = kind === 'rate-limit' ? retryAfterMsFromHeader(response) : undefined
    console.error(`Request to ${url} failed with status ${response.status}`, await response.text())
    throw new ApiError(
      kind,
      response.status,
      `Request failed with status ${response.status}`,
      retryAfterMs,
    )
  }

  try {
    return await response.json()
  } catch {
    throw new ApiError('invalid-response', response.status, 'Response body was not valid JSON')
  }
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
    throw new ApiError('invalid-response', null, 'Response failed schema validation')
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
    throw new ApiError('invalid-response', null, 'Response failed schema validation')
  }

  return result.data
}

/**
 * Complements request() for write operations while request() handles reads (GET).
 * Kept separate to avoid confusion between read and write operations.
 */
export async function mutate<T>(
  url: string,
  schema: z.ZodType<T>,
  options: MutateOptions,
): Promise<T> {
  const body = await fetchJson(url, options)
  const result = z.object({ data: schema }).safeParse(body)

  if (!result.success) {
    console.error(result.error.format())
    throw new ApiError('invalid-response', null, 'Response failed schema validation')
  }

  return result.data.data
}
