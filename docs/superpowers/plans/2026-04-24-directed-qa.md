# Directed QA Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a directed-question module where admins manage preset questions, students can submit multiple answers per question, adopted directed answers add to the existing leaderboard, and the app runs locally for review.

**Architecture:** Keep the current Vue page-oriented structure and extend it surgically. Add dedicated Supabase tables for directed questions and directed answers, extract leaderboard aggregation and directed adoption rules into small testable helpers, then wire a new front-end tab and admin sections around them.

**Tech Stack:** Vue 3, TypeScript, Vite, Vant, Tailwind, Supabase, Vitest

---

## File Map

- Create: `supabase/migrations/2026-04-24_add_directed_qa.sql`
- Create: `src/lib/leaderboard.ts`
- Create: `src/lib/directedAnswers.ts`
- Create: `src/pages/DirectedQA.vue`
- Create: `src/lib/leaderboard.test.ts`
- Create: `src/lib/directedAnswers.test.ts`
- Modify: `package.json`
- Modify: `src/pages/HomePage.vue`
- Modify: `src/pages/Leaderboard.vue`
- Modify: `src/pages/AdminView.vue`

### Task 1: Add Lightweight Test Support And Cover Core Aggregation Logic

**Files:**
- Modify: `package.json`
- Create: `src/lib/leaderboard.ts`
- Create: `src/lib/leaderboard.test.ts`

- [ ] **Step 1: Write the failing test for merged leaderboard scoring**

```ts
import { describe, expect, it } from 'vitest'
import { buildLeaderboard } from './leaderboard'

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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test -- src/lib/leaderboard.test.ts`

Expected: FAIL because `buildLeaderboard` and the test command do not exist yet.

- [ ] **Step 3: Add Vitest script and dependencies**

```json
{
  "scripts": {
    "test": "vitest run"
  },
  "devDependencies": {
    "vitest": "^3.2.4"
  }
}
```

- [ ] **Step 4: Write minimal leaderboard implementation**

```ts
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
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npm run test -- src/lib/leaderboard.test.ts`

Expected: PASS

### Task 2: Cover Directed Adoption Rules With Tests

**Files:**
- Create: `src/lib/directedAnswers.ts`
- Create: `src/lib/directedAnswers.test.ts`

- [ ] **Step 1: Write the failing tests for directed adoption updates**

```ts
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm run test -- src/lib/directedAnswers.test.ts`

Expected: FAIL because `getDirectedAdoptionUpdates` does not exist yet.

- [ ] **Step 3: Write minimal directed adoption helper**

```ts
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
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm run test -- src/lib/directedAnswers.test.ts`

Expected: PASS

### Task 3: Add Supabase Schema For Directed QA

**Files:**
- Create: `supabase/migrations/2026-04-24_add_directed_qa.sql`

- [ ] **Step 1: Write the migration**

```sql
create table if not exists directed_questions (
  id uuid primary key default gen_random_uuid(),
  question_text text not null,
  description text,
  status text not null default 'active',
  created_at timestamptz not null default now()
);

create table if not exists directed_answers (
  id uuid primary key default gen_random_uuid(),
  question_id uuid not null references directed_questions(id) on delete cascade,
  student_name text not null,
  student_id text not null,
  nickname text not null,
  answer text not null,
  status text not null default 'visible',
  is_adopted boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists directed_answers_question_id_idx on directed_answers(question_id);
create index if not exists directed_answers_student_id_idx on directed_answers(student_id);
create index if not exists directed_answers_question_student_idx on directed_answers(question_id, student_id);

create or replace view directed_answers_public as
select
  id,
  question_id,
  nickname,
  answer,
  status,
  is_adopted,
  created_at
from directed_answers;
```

- [ ] **Step 2: Apply the migration in the target Supabase environment**

Run one of:

- `supabase db push`
- or execute `supabase/migrations/2026-04-24_add_directed_qa.sql` in the project SQL editor

Expected: tables and `directed_answers_public` view are available for the app.

### Task 4: Implement The Student Directed QA Tab

**Files:**
- Create: `src/pages/DirectedQA.vue`
- Modify: `src/pages/HomePage.vue`

- [ ] **Step 1: Add the new tab to the home page**

```vue
<van-tab title="定向问答">
  <DirectedQA />
</van-tab>
```

- [ ] **Step 2: Implement the directed question page**

```ts
const questions = ref<any[]>([])
const answers = ref<any[]>([])
const activeQuestionId = ref('')
const userInfo = ref({ name: '', studentId: '', nickname: '' })
const answerText = ref('')
```

```ts
const fetchQuestions = async () => {
  const { data, error } = await supabase
    .from('directed_questions')
    .select('id, question_text, description, status, created_at')
    .eq('status', 'active')
    .order('created_at', { ascending: false })

  if (error) throw error
  questions.value = data || []
  activeQuestionId.value = questions.value[0]?.id || ''
}
```

```ts
const fetchAnswers = async () => {
  if (!activeQuestionId.value) {
    answers.value = []
    return
  }

  const { data, error } = await supabase
    .from('directed_answers_public')
    .select('id, question_id, nickname, answer, status, is_adopted, created_at')
    .eq('question_id', activeQuestionId.value)
    .eq('status', 'visible')
    .order('created_at', { ascending: false })

  if (error) throw error
  answers.value = data || []
}
```

```ts
const submitAnswer = async () => {
  await supabase.from('directed_answers').insert({
    question_id: activeQuestionId.value,
    student_name: userInfo.value.name,
    student_id: userInfo.value.studentId,
    nickname: userInfo.value.nickname,
    answer: answerText.value,
    status: 'visible',
    is_adopted: false,
  })
}
```

- [ ] **Step 3: Run build to verify the page compiles**

Run: `npm run build`

Expected: PASS

### Task 5: Extend Admin Management For Directed Questions And Answers

**Files:**
- Modify: `src/pages/AdminView.vue`
- Modify: `src/lib/directedAnswers.ts`

- [ ] **Step 1: Load directed questions and directed answers beside the existing QA list**

```ts
const directedQuestions = ref<any[]>([])
const directedAnswers = ref<any[]>([])
const activeDirectedQuestionId = ref('')
```

```ts
const fetchDirectedQuestions = async () => {
  const { data, error } = await supabase
    .from('directed_questions')
    .select('id, question_text, description, status, created_at')
    .order('created_at', { ascending: false })

  if (error) throw error
  directedQuestions.value = data || []
  activeDirectedQuestionId.value = directedQuestions.value[0]?.id || ''
}
```

```ts
const fetchDirectedAnswers = async () => {
  const query = supabase
    .from('directed_answers')
    .select('id, question_id, student_id, nickname, answer, status, is_adopted, created_at')
    .order('created_at', { ascending: false })

  const { data, error } = activeDirectedQuestionId.value
    ? await query.eq('question_id', activeDirectedQuestionId.value)
    : await query

  if (error) throw error
  directedAnswers.value = data || []
}
```

- [ ] **Step 2: Add create and toggle actions for directed questions**

```ts
const createDirectedQuestion = async (payload: { question_text: string; description: string }) => {
  const { error } = await supabase.from('directed_questions').insert({
    question_text: payload.question_text,
    description: payload.description || null,
    status: 'active',
  })

  if (error) throw error
}
```

```ts
const toggleDirectedQuestionStatus = async (id: string, status: string) => {
  const nextStatus = status === 'active' ? 'inactive' : 'active'
  const { error } = await supabase.from('directed_questions').update({ status: nextStatus }).eq('id', id)
  if (error) throw error
}
```

- [ ] **Step 3: Add directed answer adopt logic that clears old adopted rows first**

```ts
const adoptDirectedAnswer = async (answer: { id: string; question_id: string; student_id: string }) => {
  const match = getDirectedAdoptionUpdates({
    answerId: answer.id,
    questionId: answer.question_id,
    studentId: answer.student_id,
  })

  const { error: resetError } = await supabase
    .from('directed_answers')
    .update({ is_adopted: false })
    .eq('question_id', match.resetMatch.question_id)
    .eq('student_id', match.resetMatch.student_id)
    .eq('is_adopted', true)

  if (resetError) throw resetError

  const { error: activateError } = await supabase
    .from('directed_answers')
    .update({ is_adopted: true })
    .eq('id', match.activateMatch.id)

  if (activateError) throw activateError
}
```

- [ ] **Step 4: Add admin UI sections for question management and answer management**

```vue
<section class="space-y-3">
  <h2 class="text-base font-bold">Directed Questions</h2>
</section>

<section class="space-y-3">
  <h2 class="text-base font-bold">Directed Answers</h2>
</section>
```

- [ ] **Step 5: Run build to verify admin changes compile**

Run: `npm run build`

Expected: PASS

### Task 6: Switch Leaderboard To Combined Scoring

**Files:**
- Modify: `src/pages/Leaderboard.vue`
- Modify: `src/lib/leaderboard.ts`

- [ ] **Step 1: Replace inline aggregation with the shared helper**

```ts
import { buildLeaderboard } from '../lib/leaderboard'
```

```ts
const { data: qaRecords, error: qaError } = await supabase
  .from('qa_records_public')
  .select('student_id, nickname, is_adopted')
  .eq('status', 'visible')

const { data: directedRecords, error: directedError } = await supabase
  .from('directed_answers')
  .select('student_id, nickname, is_adopted')
  .eq('status', 'visible')
```

```ts
leaderboardList.value = buildLeaderboard(qaRecords || [], directedRecords || [])
```

- [ ] **Step 2: Run the helper tests and full build**

Run:

- `npm run test -- src/lib/leaderboard.test.ts src/lib/directedAnswers.test.ts`
- `npm run build`

Expected: PASS

### Task 7: Local Verification And Handoff

**Files:**
- No code changes required if all previous tasks pass

- [ ] **Step 1: Start the local dev server**

Run: `npm run dev -- --host 127.0.0.1 --port 4173`

Expected: Vite serves the app locally on `http://127.0.0.1:4173`

- [ ] **Step 2: Manually verify the main flows**

Check:

- admin can create a directed question
- the student tab shows active questions
- one student can submit multiple answers to the same question
- the admin can adopt a better later answer
- older adopted answer for that same student and same question is cleared
- combined leaderboard updates

- [ ] **Step 3: Report the local URL and any remaining setup dependency**

Report:

- local URL
- whether Supabase migration has already been applied
- any missing environment variables or remote data prerequisites
