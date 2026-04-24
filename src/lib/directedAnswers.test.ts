import { describe, expect, it } from 'vitest'
import { getDirectedAdoptionUpdates } from './directedAnswers'

describe('getDirectedAdoptionUpdates', () => {
  it('builds updates that clear other adopted answers for the same student and question', () => {
    expect(
      getDirectedAdoptionUpdates({
        answerId: 'new-answer',
        questionId: 'q-1',
        studentId: '2025001',
      }),
    ).toEqual({
      resetMatch: { question_id: 'q-1', student_id: '2025001' },
      activateMatch: { id: 'new-answer' },
    })
  })
})
