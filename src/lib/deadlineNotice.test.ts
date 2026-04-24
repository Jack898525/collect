import { describe, expect, it } from 'vitest'
import { getRemainingHours } from './deadlineNotice'

describe('getRemainingHours', () => {
  it('returns the remaining whole-up hours before the deadline and never goes below zero', () => {
    expect(
      getRemainingHours('2026-04-24T23:00:00+08:00', '2026-04-24T20:10:00+08:00'),
    ).toBe(3)

    expect(
      getRemainingHours('2026-04-24T23:00:00+08:00', '2026-04-25T01:00:00+08:00'),
    ).toBe(0)
  })
})
