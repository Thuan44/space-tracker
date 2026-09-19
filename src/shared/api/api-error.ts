export type ApiErrorKind =
  'auth' | 'not-found' | 'rate-limit' | 'client' | 'server' | 'network' | 'invalid-response'

export class ApiError extends Error {
  status: number | null
  kind: ApiErrorKind
  retryAfterMs?: number

  constructor(kind: ApiErrorKind, status: number | null, message: string, retryAfterMs?: number) {
    super(message)
    this.name = 'ApiError'
    this.kind = kind
    this.status = status
    this.retryAfterMs = retryAfterMs
  }
}
