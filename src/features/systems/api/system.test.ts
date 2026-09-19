import { describe, it, expect } from 'vitest'
import { ref } from 'vue'
import { systemKeys } from './system'

describe('systemKeys', () => {
  it('list returns a stable key for a given page', () => {
    expect(systemKeys.list(1)).toEqual(['systems', 1])
    expect(systemKeys.list(1)).toEqual(systemKeys.list(1))
  })

  it('list accepts a ref page', () => {
    const page = ref(2)
    expect(systemKeys.list(page)).toEqual(['systems', page])
  })

  it('detail returns a stable key for a given symbol', () => {
    expect(systemKeys.detail('X1-DF55')).toEqual(['system', 'X1-DF55'])
    expect(systemKeys.detail('X1-DF55')).toEqual(systemKeys.detail('X1-DF55'))
  })
})
