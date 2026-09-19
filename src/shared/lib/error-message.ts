import { ApiError } from '@/shared/api/api-error'

const MESSAGES: Partial<Record<ApiError['kind'], string>> = {
  auth: 'Invalid token. Please check and try again.',
  network: 'Could not reach the API. Check your connection and try again.',
  'rate-limit': 'Too many requests. Wait a moment and try again.',
  'not-found': 'Not found.',
}

export function getErrorMessage(error: unknown, fallback: string): string {
  if (!(error instanceof ApiError)) return fallback
  return MESSAGES[error.kind] ?? fallback
}
