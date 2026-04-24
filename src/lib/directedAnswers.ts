export interface DirectedAdoptionInput {
  answerId: string
  questionId: string
  studentId: string
}

export function getDirectedAdoptionUpdates(input: DirectedAdoptionInput) {
  return {
    resetMatch: {
      question_id: input.questionId,
      student_id: input.studentId,
    },
    activateMatch: {
      id: input.answerId,
    },
  }
}
