import { describe, it, expect } from 'vitest'
import { toReadableText, systemSymbolFromWaypoint } from './spacetraders'

describe('toReadableText', () => {
  it('replaces underscores with spaces', () => {
    expect(toReadableText('IN_ORBIT')).toBe('IN ORBIT')
  })

  it('leaves a value with no underscores unchanged', () => {
    expect(toReadableText('MARKETPLACE')).toBe('MARKETPLACE')
  })
})

describe('systemSymbolFromWaypoint', () => {
  it('joins the leading sector-system segments of a waypoint symbol', () => {
    expect(systemSymbolFromWaypoint('X1-DF55-20250Z')).toBe('X1-DF55')
  })

  it('returns the value unchanged when it has no waypoint segment', () => {
    expect(systemSymbolFromWaypoint('X1-DF55')).toBe('X1-DF55')
  })
})
