import { describe, it, expect } from 'vitest'
import { getErrorMessage } from './error-message'
import { ApiError } from '@/shared/api/api-error'

const fallback = 'Something went wrong.'

describe('getErrorMessage', () => {
  it.each([
    ['auth', 'Invalid token. Please check and try again.'],
    ['network', 'Could not reach the API. Check your connection and try again.'],
    ['rate-limit', 'Too many requests. Wait a moment and try again.'],
    ['not-found', 'Not found.'],
  ] as const)('returns the fixed message for kind "%s"', (kind, expected) => {
    expect(getErrorMessage(new ApiError(kind, null, 'boom'), fallback)).toBe(expected)
  })

  it.each(['client', 'server', 'invalid-response'] as const)(
    'returns the fallback for kind "%s"',
    (kind) => {
      expect(getErrorMessage(new ApiError(kind, null, 'boom'), fallback)).toBe(fallback)
    },
  )

  it('returns the fallback for a non-ApiError', () => {
    expect(getErrorMessage(new Error('boom'), fallback)).toBe(fallback)
  })
})
