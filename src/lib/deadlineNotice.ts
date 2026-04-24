export function getRemainingHours(deadlineIso: string, nowIso: string | Date = new Date()) {
  const deadline = new Date(deadlineIso).getTime()
  const current = new Date(nowIso).getTime()
  const diff = deadline - current

  if (diff <= 0) {
    return 0
  }

  return Math.ceil(diff / (1000 * 60 * 60))
}
