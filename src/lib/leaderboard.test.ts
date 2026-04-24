import { describe, expect, it } from 'vitest'
import { buildLeaderboard, resolveLeaderboardSourceRecords } from './leaderboard'

describe('buildLeaderboard', () => {
  it('merges free QA and directed QA adopted counts by student_id', () => {
    const result = buildLeaderboard(
      [
        { student_id: '2025001', nickname: 'A', is_adopted: true },
        { student_id: '2025001', nickname: 'A', is_adopted: false },
        { student_id: '2025002', nickname: 'B', is_adopted: true },
      ],
      [
        { student_id: '2025001', nickname: 'A2', is_adopted: true },
        { student_id: '2025003', nickname: 'C', is_adopted: false },
      ],
    )

    expect(result).toEqual([
      { rank: 1, studentId: '2025001', nickname: 'A', adoptedCount: 2, totalAnswers: 3 },
      { rank: 2, studentId: '2025002', nickname: 'B', adoptedCount: 1, totalAnswers: 1 },
    ])
  })
})

describe('resolveLeaderboardSourceRecords', () => {
  it('falls back to free QA records when directed QA source is unavailable', () => {
    const result = resolveLeaderboardSourceRecords(
      [{ student_id: '2025001', nickname: 'A', is_adopted: true }],
      null,
      null,
      new Error('relation "directed_answers_public" does not exist'),
    )

    expect(result).toEqual({
      freeQaRecords: [{ student_id: '2025001', nickname: 'A', is_adopted: true }],
      directedAnswerRecords: [],
      usedDirectedFallback: true,
    })

    expect(buildLeaderboard(result.freeQaRecords, result.directedAnswerRecords)).toEqual([
      { rank: 1, studentId: '2025001', nickname: 'A', adoptedCount: 1, totalAnswers: 1 },
    ])
  })

  it('throws when the free QA source is unavailable', () => {
    expect(() =>
      resolveLeaderboardSourceRecords(
        null,
        new Error('qa failed'),
        [{ student_id: '2025001', nickname: 'A', is_adopted: true }],
        null,
      ),
    ).toThrow('qa failed')
  })
})
