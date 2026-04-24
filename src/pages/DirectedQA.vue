<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { showLoadingToast, showSuccessToast, showToast } from 'vant'
import { supabase } from '../utils/supabase'

interface DirectedQuestion {
  id: string
  question_text: string
  description: string | null
  status: string
  created_at: string
}

interface DirectedAnswer {
  id: string
  question_id: string
  nickname: string
  answer: string
  status: string
  is_adopted: boolean
  created_at: string
}

const questions = ref<DirectedQuestion[]>([])
const answers = ref<DirectedAnswer[]>([])
const loadingQuestions = ref(true)
const loadingAnswers = ref(false)
const activeQuestionId = ref('')
const answerText = ref('')
const isSubmitting = ref(false)

const userInfo = ref({
  name: '',
  studentId: '',
  nickname: '',
})

const hasLoadedHistory = ref(false)

const activeQuestion = computed(() => {
  return questions.value.find((question) => question.id === activeQuestionId.value) || null
})

const fetchQuestions = async () => {
  try {
    loadingQuestions.value = true
    const { data, error } = await supabase
      .from('directed_questions')
      .select('id, question_text, description, status, created_at')
      .eq('status', 'active')
      .order('created_at', { ascending: false })

    if (error) {
      throw error
    }

    questions.value = data || []
    if (!activeQuestionId.value || !questions.value.some((question) => question.id === activeQuestionId.value)) {
      activeQuestionId.value = questions.value[0]?.id || ''
    }
  } catch (err) {
    console.error('Failed to load directed questions:', err)
    showToast('加载定向题目失败')
  } finally {
    loadingQuestions.value = false
  }
}

const fetchAnswers = async () => {
  if (!activeQuestionId.value) {
    answers.value = []
    return
  }

  try {
    loadingAnswers.value = true
    const { data, error } = await supabase
      .from('directed_answers_public')
      .select('id, question_id, nickname, answer, status, is_adopted, created_at')
      .eq('question_id', activeQuestionId.value)
      .eq('status', 'visible')
      .order('created_at', { ascending: false })

    if (error) {
      throw error
    }

    answers.value = data || []
  } catch (err) {
    console.error('Failed to load directed answers:', err)
    showToast('加载回答失败')
  } finally {
    loadingAnswers.value = false
  }
}

const submitAnswer = async () => {
  if (!userInfo.value.name || !userInfo.value.studentId || !userInfo.value.nickname) {
    showToast('请先补全身份信息')
    return
  }

  if (!activeQuestionId.value) {
    showToast('当前没有可作答的题目')
    return
  }

  if (!answerText.value.trim()) {
    showToast('请输入你的回答')
    return
  }

  try {
    isSubmitting.value = true
    const loadingToast = showLoadingToast({
      message: '正在提交...',
      forbidClick: true,
      duration: 0,
    })

    const { error } = await supabase.from('directed_answers').insert({
      question_id: activeQuestionId.value,
      student_name: userInfo.value.name,
      student_id: userInfo.value.studentId,
      nickname: userInfo.value.nickname,
      answer: answerText.value.trim(),
      status: 'visible',
      is_adopted: false,
    })

    loadingToast.close()

    if (error) {
      throw error
    }

    localStorage.setItem(
      'qa_user_info',
      JSON.stringify({
        name: userInfo.value.name,
        studentId: userInfo.value.studentId,
        nickname: userInfo.value.nickname,
      }),
    )
    hasLoadedHistory.value = true

    answerText.value = ''
    showSuccessToast('提交成功')
    await fetchAnswers()
  } catch (err: any) {
    console.error('Failed to submit directed answer:', err)
    showToast(err.message || '提交失败，请稍后重试')
  } finally {
    isSubmitting.value = false
  }
}

const formatTime = (timeStr: string) => {
  return new Date(timeStr).toLocaleDateString('zh-CN', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

onMounted(async () => {
  const savedUserInfo = localStorage.getItem('qa_user_info')
  if (savedUserInfo) {
    try {
      const parsed = JSON.parse(savedUserInfo)
      userInfo.value = {
        name: parsed.name || '',
        studentId: parsed.studentId || '',
        nickname: parsed.nickname || '',
      }
      hasLoadedHistory.value = true
    } catch (err) {
      console.error('Failed to parse cached user info:', err)
    }
  }

  await fetchQuestions()
})

watch(activeQuestionId, async () => {
  await fetchAnswers()
})
</script>

<template>
  <div class="bg-gray-50 min-h-screen p-4 safe-area-bottom pb-20 space-y-4">
    <div class="bg-white rounded-xl shadow-sm overflow-hidden relative">
      <div
        v-if="hasLoadedHistory"
        class="absolute right-0 top-0 bg-primary/10 text-primary text-[10px] px-2 py-0.5 rounded-bl-lg font-medium"
      >
        已自动加载身份信息
      </div>

      <div class="px-4 py-3 bg-gray-50/50 border-b border-gray-100">
        <div class="text-sm font-bold text-gray-700">身份信息</div>
        <div class="text-[11px] text-gray-500 mt-1">定向问答会复用这里的姓名、学号和展示昵称</div>
      </div>

      <van-field v-model="userInfo.name" label="真实姓名" placeholder="请输入真实姓名" />
      <van-field v-model="userInfo.studentId" label="学号" type="digit" placeholder="请输入学号" />
      <van-field v-model="userInfo.nickname" label="展示昵称" placeholder="请输入展示昵称" />
    </div>

    <div class="bg-white rounded-xl shadow-sm overflow-hidden">
      <div class="px-4 py-3 bg-gray-50/50 border-b border-gray-100">
        <div class="text-sm font-bold text-gray-700">题目列表</div>
        <div class="text-[11px] text-gray-500 mt-1">管理员预设的问题会展示在这里</div>
      </div>

      <div v-if="loadingQuestions" class="py-12 flex justify-center">
        <van-loading type="spinner" color="#3B82F6" />
      </div>

      <div v-else-if="questions.length === 0" class="py-12 text-center text-gray-400">
        目前还没有定向题目
      </div>

      <div v-else class="p-4">
        <van-collapse v-model="activeQuestionId" accordion class="rounded-xl overflow-hidden border border-gray-100">
          <van-collapse-item
            v-for="question in questions"
            :key="question.id"
            :name="question.id"
          >
            <template #title>
              <div 
                class="font-semibold text-sm transition-colors whitespace-normal leading-snug" 
                :class="activeQuestionId === question.id ? 'text-primary' : 'text-gray-800'"
              >
                {{ question.question_text }}
              </div>
            </template>
            <div class="text-xs text-gray-500 whitespace-pre-wrap leading-relaxed">
              {{ question.description || '暂无补充描述' }}
            </div>
          </van-collapse-item>
        </van-collapse>
      </div>
    </div>

    <div class="bg-white rounded-xl shadow-sm overflow-hidden">
      <div class="px-4 py-3 bg-gray-50/50 border-b border-gray-100">
        <div class="text-sm font-bold text-gray-700">当前题目</div>
        <div v-if="activeQuestion" class="text-base font-semibold text-gray-800 mt-2">
          {{ activeQuestion.question_text }}
        </div>
        <div v-if="activeQuestion?.description" class="text-sm text-gray-500 mt-1">
          {{ activeQuestion.description }}
        </div>
      </div>

      <div class="p-4">
        <van-field
          v-model="answerText"
          label="你的回答"
          type="textarea"
          autosize
          rows="4"
          label-align="top"
          placeholder="围绕当前题目写下你的经验和建议"
        />

        <van-button
          round
          block
          type="primary"
          color="#3B82F6"
          :loading="isSubmitting"
          loading-text="正在提交..."
          class="mt-4"
          @click="submitAnswer"
        >
          提交回答
        </van-button>
      </div>
    </div>

    <div class="bg-white rounded-xl shadow-sm overflow-hidden">
      <div class="px-4 py-3 bg-gray-50/50 border-b border-gray-100">
        <div class="text-sm font-bold text-gray-700">本题公开回答</div>
        <div class="text-[11px] text-gray-500 mt-1">只展示当前题目下公开的回答</div>
      </div>

      <div v-if="loadingAnswers" class="py-12 flex justify-center">
        <van-loading type="spinner" color="#3B82F6" />
      </div>

      <div v-else-if="!activeQuestionId" class="py-12 text-center text-gray-400">
        请选择一个题目
      </div>

      <div v-else-if="answers.length === 0" class="py-12 text-center text-gray-400">
        这个题目下还没有公开回答
      </div>

      <div v-else class="p-4 space-y-3">
        <div v-for="answer in answers" :key="answer.id" class="rounded-xl border border-gray-100 p-4">
          <div class="flex items-center justify-between gap-3">
            <div class="text-sm font-semibold text-gray-800">{{ answer.nickname }}</div>
            <div class="flex items-center gap-2">
              <span
                v-if="answer.is_adopted"
                class="px-2 py-1 rounded-full text-[10px] font-medium bg-amber-100 text-amber-600"
              >
                已采纳
              </span>
              <span class="text-xs text-gray-400">{{ formatTime(answer.created_at) }}</span>
            </div>
          </div>

          <div class="text-sm text-gray-600 whitespace-pre-wrap leading-relaxed mt-3">
            {{ answer.answer }}
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
