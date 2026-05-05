export interface AdminStudentInfo {
  student_id: string
  student_name: string
  nickname: string
}

export function formatAdminStudentInfo(student: AdminStudentInfo) {
  return `学号：${student.student_id} · 姓名：${student.student_name} · 昵称：${student.nickname}`
}

export function matchesAdminStudentInfo(student: AdminStudentInfo, query: string) {
  const normalizedQuery = query.trim().toLowerCase()

  return (
    student.student_id.toLowerCase().includes(normalizedQuery) ||
    student.student_name.toLowerCase().includes(normalizedQuery) ||
    student.nickname.toLowerCase().includes(normalizedQuery)
  )
}
