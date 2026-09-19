import { describe, it, expect } from 'vitest'
import { ref } from 'vue'
import { shipKeys } from './ship'

describe('shipKeys', () => {
  it('list returns a stable key for a given page', () => {
    expect(shipKeys.list(1)).toEqual(['ships', 1])
    expect(shipKeys.list(1)).toEqual(shipKeys.list(1))
  })

  it('list accepts a ref page', () => {
    const page = ref(2)
    expect(shipKeys.list(page)).toEqual(['ships', page])
  })

  it('preview returns a stable key', () => {
    expect(shipKeys.preview()).toEqual(['ships', 'preview'])
    expect(shipKeys.preview()).toEqual(shipKeys.preview())
  })

  it('detail returns a stable key for a given symbol', () => {
    expect(shipKeys.detail('PICKLE-1')).toEqual(['ship', 'PICKLE-1'])
    expect(shipKeys.detail('PICKLE-1')).toEqual(shipKeys.detail('PICKLE-1'))
  })
})
