export interface ScoreRecord {
  student_id: string
  nickname: string
  is_adopted: boolean
}

export interface LeaderboardRow {
  rank: number
  studentId: string
  nickname: string
  adoptedCount: number
  totalAnswers: number
}

export function buildLeaderboard(
  freeQaRecords: ScoreRecord[],
  directedAnswerRecords: ScoreRecord[],
): LeaderboardRow[] {
  const stats = new Map<string, { nickname: string; adoptedCount: number; totalAnswers: number }>()

  for (const record of [...freeQaRecords, ...directedAnswerRecords]) {
    if (!stats.has(record.student_id)) {
      stats.set(record.student_id, {
        nickname: record.nickname,
        adoptedCount: 0,
        totalAnswers: 0,
      })
    }

    const current = stats.get(record.student_id)!
    current.totalAnswers += 1

    if (record.is_adopted) {
      current.adoptedCount += 1
    }
  }

  return Array.from(stats.entries())
    .filter(([, value]) => value.adoptedCount > 0)
    .sort((a, b) => b[1].adoptedCount - a[1].adoptedCount)
    .map(([studentId, value], index) => ({
      rank: index + 1,
      studentId,
      nickname: value.nickname,
      adoptedCount: value.adoptedCount,
      totalAnswers: value.totalAnswers,
    }))
}
