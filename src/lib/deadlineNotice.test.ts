import { describe, expect, it } from 'vitest'
import { getRemainingHours } from './deadlineNotice'

describe('getRemainingHours', () => {
  it('returns the remaining whole-up hours before the deadline and never goes below zero', () => {
    expect(
      getRemainingHours('2026-04-25T12:00:00+08:00', '2026-04-25T09:10:00+08:00'),
    ).toBe(3)

    expect(
      getRemainingHours('2026-04-25T12:00:00+08:00', '2026-04-25T13:00:00+08:00'),
    ).toBe(0)
  })
})
