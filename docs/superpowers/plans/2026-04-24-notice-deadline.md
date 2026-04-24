# Notice Deadline Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Update the front-page notice so it shows a shared fixed deadline and dynamically renders the remaining hours in a new announcement about the directed QA module.

**Architecture:** Keep the scope inside the existing announcement page. Add one tiny tested helper for deadline-hour calculation, then rework the notice block in `QADisplay.vue` to consume that helper and refresh on a timer.

**Tech Stack:** Vue 3, TypeScript, Vitest, Vant

---

## File Map

- Create: `src/lib/deadlineNotice.ts`
- Create: `src/lib/deadlineNotice.test.ts`
- Modify: `src/pages/QADisplay.vue`

### Task 1: Add Tested Deadline Calculation Helper

**Files:**
- Create: `src/lib/deadlineNotice.ts`
- Create: `src/lib/deadlineNotice.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test -- src/lib/deadlineNotice.test.ts`

Expected: FAIL because `getRemainingHours` does not exist yet.

- [ ] **Step 3: Write the minimal implementation**

```ts
export function getRemainingHours(deadlineIso: string, nowIso: string | Date = new Date()) {
  const deadline = new Date(deadlineIso).getTime()
  const current = new Date(nowIso).getTime()
  const diff = deadline - current

  if (diff <= 0) {
    return 0
  }

  return Math.ceil(diff / (1000 * 60 * 60))
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm run test -- src/lib/deadlineNotice.test.ts`

Expected: PASS

### Task 2: Rework The Notice UI To Use The Helper

**Files:**
- Modify: `src/pages/QADisplay.vue`

- [ ] **Step 1: Add fixed deadline state and timer-driven refresh**

```ts
const RANKING_DEADLINE = '2026-04-24T23:00:00+08:00'
const remainingHours = ref(getRemainingHours(RANKING_DEADLINE))
```

```ts
let noticeTimer: ReturnType<typeof setInterval> | null = null

const updateRemainingHours = () => {
  remainingHours.value = getRemainingHours(RANKING_DEADLINE)
}
```

```ts
onMounted(() => {
  fetchQAList()
  updateRemainingHours()
  noticeTimer = window.setInterval(updateRemainingHours, 60 * 1000)
})
```

```ts
onUnmounted(() => {
  if (noticeTimer) {
    clearInterval(noticeTimer)
  }
})
```

- [ ] **Step 2: Replace the old hard-coded notice text with the new announcement copy**

```vue
<div v-if="isNoticeExpanded" class="space-y-2 pb-4">
  <p>
    距离本次排行榜截止还有
    <span class="font-bold text-amber-700">{{ remainingHours }}</span>
    小时。最近我们发现，还有一些很有价值的问题和经验点暂时没有被大家充分发觉。
  </p>
  <p>
    为了帮助更多同学继续冲榜、争取奖励，我们特地开设了“定向问答”栏目，希望把这些值得补充的内容也尽快收集起来。
  </p>
  <p>
    欢迎大家积极参与，补充你最熟悉、最有帮助的经验内容，一起把这份新生经验库做得更完整。
  </p>
</div>
```

- [ ] **Step 3: Run the focused test and full build**

Run:

- `npm run test -- src/lib/deadlineNotice.test.ts`
- `npm run build`

Expected: PASS
