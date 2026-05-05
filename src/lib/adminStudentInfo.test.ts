import { describe, expect, it } from 'vitest'
import { formatAdminStudentInfo, matchesAdminStudentInfo } from './adminStudentInfo'

describe('formatAdminStudentInfo', () => {
  it('includes student id, real name, and nickname for admin statistics', () => {
    expect(
      formatAdminStudentInfo({
        student_id: '2025001',
        student_name: '张三',
        nickname: '小张',
      }),
    ).toBe('学号：2025001 · 姓名：张三 · 昵称：小张')
  })
})

describe('matchesAdminStudentInfo', () => {
  it('matches by real name', () => {
    expect(
      matchesAdminStudentInfo(
        {
          student_id: '2025001',
          student_name: '张三',
          nickname: '小张',
        },
        '张三',
      ),
    ).toBe(true)
  })
})
