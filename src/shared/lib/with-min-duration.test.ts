import { describe, it, expect, vi } from 'vitest'
import { withMinDuration } from './with-min-duration'

describe('withMinDuration', () => {
  it('resolves with the original value', async () => {
    await expect(withMinDuration(Promise.resolve('value'), 0)).resolves.toBe('value')
  })

  it('waits at least the minimum duration even if the promise resolves faster', async () => {
    vi.useFakeTimers()
    const promise = withMinDuration(Promise.resolve('value'), 400)

    let resolved = false
    promise.then(() => {
      resolved = true
    })

    await Promise.resolve()
    expect(resolved).toBe(false)

    await vi.advanceTimersByTimeAsync(400)
    expect(resolved).toBe(true)

    vi.useRealTimers()
  })

  it('rejects if the underlying promise rejects', async () => {
    await expect(withMinDuration(Promise.reject(new Error('fail')), 0)).rejects.toThrow('fail')
  })
})
