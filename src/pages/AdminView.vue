<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { showConfirmDialog, showToast } from 'vant'
import { getDirectedAdoptionUpdates } from '../lib/directedAnswers'
import { supabase } from '../utils/supabase'

interface QARecord {
  id: string
  student_id: string
  nickname: string
  category: string
  sub_category: string
  question: string
  answer: string
  status: string
  is_adopted: boolean
  is_pinned: boolean
  created_at: string
}

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
  student_id: string
  nickname: string
  answer: string
  status: string
  is_adopted: boolean
  created_at: string
}

const adminTab = ref(0)

const qaList = ref<QARecord[]>([])
const qaLoading = ref(true)
const qaSearchQuery = ref('')

const directedQuestions = ref<DirectedQuestion[]>([])
const directedQuestionLoading = ref(true)
const directedQuestionSearch = ref('')
const directedQuestionForm = ref({
  id: '',
  questionText: '',
  description: '',
})

const directedAnswers = ref<DirectedAnswer[]>([])
const directedAnswerLoading = ref(true)
const directedAnswerSearch = ref('')
const activeDirectedQuestionId = ref('')

const filteredQAList = computed(() => {
  const query = qaSearchQuery.value.trim().toLowerCase()
  if (!query) {
    return qaList.value
  }

  return qaList.value.filter((qa) => {
    return (
      qa.question.toLowerCase().includes(query) ||
      qa.answer.toLowerCase().includes(query) ||
      qa.nickname.toLowerCase().includes(query)
    )
  })
})

const filteredDirectedQuestions = computed(() => {
  const query = directedQuestionSearch.value.trim().toLowerCase()
  if (!query) {
    return directedQuestions.value
  }

  return directedQuestions.value.filter((question) => {
    return (
      question.question_text.toLowerCase().includes(query) ||
      (question.description || '').toLowerCase().includes(query)
    )
  })
})

const filteredDirectedAnswers = computed(() => {
  const query = directedAnswerSearch.value.trim().toLowerCase()

  return directedAnswers.value.filter((answer) => {
    const matchesQuestion = activeDirectedQuestionId.value
      ? answer.question_id === activeDirectedQuestionId.value
      : true

    const matchesSearch = query
      ? answer.nickname.toLowerCase().includes(query) ||
        answer.student_id.toLowerCase().includes(query) ||
        answer.answer.toLowerCase().includes(query)
      : true

    return matchesQuestion && matchesSearch
  })
})

const fetchAllQA = async () => {
  try {
    qaLoading.value = true
    const { data, error } = await supabase
      .from('qa_records')
      .select('id, student_id, nickname, category, sub_category, question, answer, status, is_adopted, is_pinned, created_at')
      .order('is_pinned', { ascending: false })
      .order('created_at', { ascending: false })

    if (error) {
      throw error
    }

    qaList.value = data || []
  } catch (err) {
    console.error('Failed to fetch free QA records:', err)
    showToast('加载自由 QA 失败')
  } finally {
    qaLoading.value = false
  }
}

const fetchDirectedQuestions = async () => {
  try {
    directedQuestionLoading.value = true
    const { data, error } = await supabase
      .from('directed_questions')
      .select('id, question_text, description, status, created_at')
      .order('created_at', { ascending: false })

    if (error) {
      throw error
    }

    directedQuestions.value = data || []
    if (
      !activeDirectedQuestionId.value ||
      !directedQuestions.value.some((question) => question.id === activeDirectedQuestionId.value)
    ) {
      activeDirectedQuestionId.value = directedQuestions.value[0]?.id || ''
    }
  } catch (err) {
    console.error('Failed to fetch directed questions:', err)
    showToast('加载定向题目失败')
  } finally {
    directedQuestionLoading.value = false
  }
}

const fetchDirectedAnswers = async () => {
  try {
    directedAnswerLoading.value = true
    const { data, error } = await supabase
      .from('directed_answers')
      .select('id, question_id, student_id, nickname, answer, status, is_adopted, created_at')
      .order('created_at', { ascending: false })

    if (error) {
      throw error
    }

    directedAnswers.value = data || []
  } catch (err) {
    console.error('Failed to fetch directed answers:', err)
    showToast('加载定向回答失败')
  } finally {
    directedAnswerLoading.value = false
  }
}

const handleAdopt = async (id: string, currentStatus: boolean) => {
  const nextStatus = !currentStatus
  try {
    const { error } = await supabase.from('qa_records').update({ is_adopted: nextStatus }).eq('id', id)

    if (error) {
      throw error
    }

    const item = qaList.value.find((qa) => qa.id === id)
    if (item) {
      item.is_adopted = nextStatus
    }

    showToast(nextStatus ? '已采纳' : '已取消采纳')
  } catch (err) {
    console.error('Failed to update free QA adoption:', err)
    showToast('操作失败')
  }
}

const handleHide = async (id: string, currentStatus: string) => {
  const nextStatus = currentStatus === 'visible' ? 'hidden' : 'visible'
  try {
    const { error } = await supabase.from('qa_records').update({ status: nextStatus }).eq('id', id)

    if (error) {
      throw error
    }

    const item = qaList.value.find((qa) => qa.id === id)
    if (item) {
      item.status = nextStatus
    }

    showToast(nextStatus === 'hidden' ? '已隐藏' : '已恢复显示')
  } catch (err) {
    console.error('Failed to update free QA visibility:', err)
    showToast('操作失败')
  }
}

const handleDelete = (id: string) => {
  showConfirmDialog({
    title: '删除自由 QA',
    message: '确认删除这条自由 QA 吗？',
  })
    .then(async () => {
      try {
        const { error } = await supabase.from('qa_records').delete().eq('id', id)

        if (error) {
          throw error
        }

        qaList.value = qaList.value.filter((qa) => qa.id !== id)
        showToast('已删除')
      } catch (err) {
        console.error('Failed to delete free QA:', err)
        showToast('删除失败')
      }
    })
    .catch(() => {})
}

const handlePin = async (id: string, currentPinned: boolean) => {
  const nextPinnedStatus = !currentPinned
  try {
    const { error } = await supabase
      .from('qa_records')
      .update({ is_pinned: nextPinnedStatus })
      .eq('id', id)

    if (error) {
      throw error
    }

    const item = qaList.value.find((qa) => qa.id === id)
    if (item) {
      item.is_pinned = nextPinnedStatus
    }

    showToast(nextPinnedStatus ? '已置顶' : '已取消置顶')
  } catch (err) {
    console.error('Failed to update free QA pin status:', err)
    showToast('操作失败')
  }
}

const resetDirectedQuestionForm = () => {
  directedQuestionForm.value = {
    id: '',
    questionText: '',
    description: '',
  }
}

const submitDirectedQuestion = async () => {
  if (!directedQuestionForm.value.questionText.trim()) {
    showToast('请输入题目')
    return
  }

  try {
    const payload = {
      question_text: directedQuestionForm.value.questionText.trim(),
      description: directedQuestionForm.value.description.trim() || null,
    }

    if (directedQuestionForm.value.id) {
      const { error } = await supabase
        .from('directed_questions')
        .update(payload)
        .eq('id', directedQuestionForm.value.id)

      if (error) {
        throw error
      }
    } else {
      const { error } = await supabase.from('directed_questions').insert({
        ...payload,
        status: 'active',
      })

      if (error) {
        throw error
      }
    }

    showToast(directedQuestionForm.value.id ? '题目已更新' : '题目已创建')
    resetDirectedQuestionForm()
    await fetchDirectedQuestions()
  } catch (err) {
    console.error('Failed to save directed question:', err)
    showToast('保存题目失败')
  }
}

const editDirectedQuestion = (question: DirectedQuestion) => {
  directedQuestionForm.value = {
    id: question.id,
    questionText: question.question_text,
    description: question.description || '',
  }
}

const toggleDirectedQuestionStatus = async (id: string, status: string) => {
  const nextStatus = status === 'active' ? 'inactive' : 'active'
  try {
    const { error } = await supabase.from('directed_questions').update({ status: nextStatus }).eq('id', id)

    if (error) {
      throw error
    }

    const item = directedQuestions.value.find((question) => question.id === id)
    if (item) {
      item.status = nextStatus
    }

    showToast(nextStatus === 'active' ? '题目已启用' : '题目已停用')
  } catch (err) {
    console.error('Failed to toggle directed question status:', err)
    showToast('操作失败')
  }
}

const deleteDirectedQuestion = (id: string) => {
  showConfirmDialog({
    title: '删除定向题目',
    message: '删除后该题目的回答会一并删除，确认继续吗？',
  })
    .then(async () => {
      try {
        const { error } = await supabase.from('directed_questions').delete().eq('id', id)

        if (error) {
          throw error
        }

        directedQuestions.value = directedQuestions.value.filter((question) => question.id !== id)
        directedAnswers.value = directedAnswers.value.filter((answer) => answer.question_id !== id)
        if (activeDirectedQuestionId.value === id) {
          activeDirectedQuestionId.value = directedQuestions.value[0]?.id || ''
        }
        showToast('题目已删除')
      } catch (err) {
        console.error('Failed to delete directed question:', err)
        showToast('删除失败')
      }
    })
    .catch(() => {})
}

const handleDirectedAnswerAdopt = async (answer: DirectedAnswer) => {
  try {
    if (answer.is_adopted) {
      const { error } = await supabase
        .from('directed_answers')
        .update({ is_adopted: false })
        .eq('id', answer.id)

      if (error) {
        throw error
      }

      answer.is_adopted = false
      showToast('已取消采纳')
      return
    }

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

    if (resetError) {
      throw resetError
    }

    const { error: activateError } = await supabase
      .from('directed_answers')
      .update({ is_adopted: true })
      .eq('id', match.activateMatch.id)

    if (activateError) {
      throw activateError
    }

    directedAnswers.value.forEach((item) => {
      if (item.question_id === answer.question_id && item.student_id === answer.student_id) {
        item.is_adopted = item.id === answer.id
      }
    })

    showToast('已采纳这条回答')
  } catch (err) {
    console.error('Failed to adopt directed answer:', err)
    showToast('采纳失败')
  }
}

const handleDirectedAnswerHide = async (answer: DirectedAnswer) => {
  const nextStatus = answer.status === 'visible' ? 'hidden' : 'visible'
  try {
    const { error } = await supabase
      .from('directed_answers')
      .update({ status: nextStatus })
      .eq('id', answer.id)

    if (error) {
      throw error
    }

    answer.status = nextStatus
    showToast(nextStatus === 'hidden' ? '回答已隐藏' : '回答已恢复显示')
  } catch (err) {
    console.error('Failed to update directed answer visibility:', err)
    showToast('操作失败')
  }
}

const handleDirectedAnswerDelete = (id: string) => {
  showConfirmDialog({
    title: '删除定向回答',
    message: '确认删除这条定向回答吗？',
  })
    .then(async () => {
      try {
        const { error } = await supabase.from('directed_answers').delete().eq('id', id)

        if (error) {
          throw error
        }

        directedAnswers.value = directedAnswers.value.filter((answer) => answer.id !== id)
        showToast('回答已删除')
      } catch (err) {
        console.error('Failed to delete directed answer:', err)
        showToast('删除失败')
      }
    })
    .catch(() => {})
}

const getDirectedQuestionTitle = (questionId: string) => {
  return directedQuestions.value.find((question) => question.id === questionId)?.question_text || '未知题目'
}

const formatTime = (timeStr: string) => {
  return new Date(timeStr).toLocaleString('zh-CN', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

onMounted(async () => {
  await Promise.all([fetchAllQA(), fetchDirectedQuestions(), fetchDirectedAnswers()])
})
</script>

<template>
  <div class="min-h-screen bg-gray-50 pb-20">
    <div class="safe-area-top">
      <van-nav-bar title="Workspace" class="sticky top-0 z-50 bg-white/90 backdrop-blur-md" />

      <van-tabs v-model:active="adminTab" sticky animated class="top-[46px]">
        <van-tab title="自由 QA">
          <div class="bg-white px-3 py-2 sticky top-[90px] z-40 border-b border-gray-100 shadow-sm">
            <van-search
              v-model="qaSearchQuery"
              placeholder="搜索自由 QA"
              background="transparent"
              shape="round"
              clearable
              class="!p-0"
            />
          </div>

          <div class="p-4 space-y-4">
            <div v-if="qaLoading" class="py-20 flex justify-center">
              <van-loading type="spinner" color="#3B82F6" />
            </div>

            <div v-else-if="filteredQAList.length === 0" class="py-20 text-center text-gray-400">
              没有自由 QA 记录
            </div>

            <div v-for="qa in filteredQAList" v-else :key="qa.id" class="bg-white rounded-xl p-4 shadow-sm relative">
              <div
                v-if="qa.is_pinned"
                class="absolute -top-2 -right-2 bg-red-500 text-white text-[10px] px-2 py-0.5 rounded-full shadow-sm font-bold z-10"
              >
                置顶
              </div>

              <div class="flex justify-between items-start mb-2">
                <div class="text-xs text-gray-500">
                  <span class="font-bold text-gray-700 mr-2">学号：{{ qa.student_id }}</span>
                  <span>昵称：{{ qa.nickname }}</span>
                </div>
                <span
                  class="px-2 py-0.5 rounded text-[10px]"
                  :class="qa.status === 'visible' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'"
                >
                  {{ qa.status === 'visible' ? '显示中' : '已隐藏' }}
                </span>
              </div>

              <div class="bg-gray-50 p-3 rounded-lg text-sm mb-3">
                <div class="font-bold text-gray-800 mb-1">
                  <span class="text-primary mr-1">Q:</span>{{ qa.question }}
                </div>
                <div class="text-gray-600">
                  <span class="text-secondary font-bold mr-1">A:</span>{{ qa.answer }}
                </div>
                <div class="text-xs text-gray-400 mt-2 text-right">
                  {{ qa.category }} / {{ qa.sub_category }} · {{ formatTime(qa.created_at) }}
                </div>
              </div>

              <div class="flex flex-wrap gap-2 pt-3 border-t border-gray-100">
                <van-button size="small" plain :type="qa.is_pinned ? 'warning' : 'default'" @click="handlePin(qa.id, qa.is_pinned)">
                  {{ qa.is_pinned ? '取消置顶' : '置顶' }}
                </van-button>
                <van-button size="small" plain :type="qa.status === 'hidden' ? 'success' : 'danger'" @click="handleHide(qa.id, qa.status)">
                  {{ qa.status === 'hidden' ? '恢复显示' : '隐藏' }}
                </van-button>
                <van-button
                  size="small"
                  :type="qa.is_adopted ? 'default' : 'primary'"
                  :color="qa.is_adopted ? '#9CA3AF' : '#F59E0B'"
                  class="border-none"
                  @click="handleAdopt(qa.id, qa.is_adopted)"
                >
                  {{ qa.is_adopted ? '取消采纳' : '采纳' }}
                </van-button>
                <van-button size="small" plain type="danger" icon="delete-o" @click="handleDelete(qa.id)">
                  删除
                </van-button>
              </div>
            </div>
          </div>
        </van-tab>

        <van-tab title="定向题目">
          <div class="p-4 space-y-4">
            <div class="bg-white rounded-xl shadow-sm overflow-hidden">
              <div class="px-4 py-3 border-b border-gray-100 bg-gray-50/60">
                <div class="text-sm font-bold text-gray-800">题目管理</div>
                <div class="text-xs text-gray-500 mt-1">创建、编辑、启用或停用定向问答题目</div>
              </div>

              <van-field v-model="directedQuestionForm.questionText" label="题目" placeholder="请输入定向问题题干" />
              <van-field
                v-model="directedQuestionForm.description"
                label="说明"
                type="textarea"
                autosize
                label-align="top"
                placeholder="可选的补充说明"
              />

              <div class="flex gap-2 px-4 pb-4">
                <van-button round block type="primary" @click="submitDirectedQuestion">
                  {{ directedQuestionForm.id ? '更新题目' : '新增题目' }}
                </van-button>
                <van-button v-if="directedQuestionForm.id" round block type="default" @click="resetDirectedQuestionForm">
                  取消编辑
                </van-button>
              </div>
            </div>

            <div class="bg-white rounded-xl shadow-sm overflow-hidden">
              <van-search
                v-model="directedQuestionSearch"
                placeholder="搜索题目"
                background="transparent"
                shape="round"
                clearable
              />

              <div v-if="directedQuestionLoading" class="py-12 flex justify-center">
                <van-loading type="spinner" color="#3B82F6" />
              </div>

              <div v-else-if="filteredDirectedQuestions.length === 0" class="py-12 text-center text-gray-400">
                没有定向题目
              </div>

              <div v-for="question in filteredDirectedQuestions" v-else :key="question.id" class="p-4 border-t border-gray-50">
                <div class="flex items-start justify-between gap-3">
                  <div class="flex-1">
                    <div class="font-semibold text-gray-800">{{ question.question_text }}</div>
                    <div v-if="question.description" class="text-sm text-gray-500 mt-1 whitespace-pre-wrap">
                      {{ question.description }}
                    </div>
                    <div class="text-xs text-gray-400 mt-2">
                      {{ formatTime(question.created_at) }}
                    </div>
                  </div>
                  <span
                    class="px-2 py-1 rounded-full text-[10px] font-medium"
                    :class="question.status === 'active' ? 'bg-green-100 text-green-600' : 'bg-gray-200 text-gray-500'"
                  >
                    {{ question.status === 'active' ? '启用中' : '已停用' }}
                  </span>
                </div>

                <div class="flex flex-wrap gap-2 mt-3">
                  <van-button size="small" plain type="primary" @click="editDirectedQuestion(question)">编辑</van-button>
                  <van-button size="small" plain :type="question.status === 'active' ? 'warning' : 'success'" @click="toggleDirectedQuestionStatus(question.id, question.status)">
                    {{ question.status === 'active' ? '停用' : '启用' }}
                  </van-button>
                  <van-button size="small" plain type="danger" @click="deleteDirectedQuestion(question.id)">删除</van-button>
                </div>
              </div>
            </div>
          </div>
        </van-tab>

        <van-tab title="定向回答">
          <div class="p-4 space-y-4">
            <div class="bg-white rounded-xl shadow-sm overflow-hidden">
              <van-search
                v-model="directedAnswerSearch"
                placeholder="搜索昵称、学号或回答内容"
                background="transparent"
                shape="round"
                clearable
              />

              <div class="px-4 pb-4 overflow-x-auto whitespace-nowrap flex gap-2">
                <div
                  class="inline-flex px-4 py-1.5 rounded-full text-sm font-medium cursor-pointer"
                  :class="!activeDirectedQuestionId ? 'bg-primary text-white' : 'bg-gray-100 text-gray-600'"
                  @click="activeDirectedQuestionId = ''"
                >
                  全部题目
                </div>
                <div
                  v-for="question in directedQuestions"
                  :key="question.id"
                  class="inline-flex px-4 py-1.5 rounded-full text-sm font-medium cursor-pointer"
                  :class="activeDirectedQuestionId === question.id ? 'bg-primary text-white' : 'bg-gray-100 text-gray-600'"
                  @click="activeDirectedQuestionId = question.id"
                >
                  {{ question.question_text }}
                </div>
              </div>
            </div>

            <div v-if="directedAnswerLoading" class="py-20 flex justify-center">
              <van-loading type="spinner" color="#3B82F6" />
            </div>

            <div v-else-if="filteredDirectedAnswers.length === 0" class="py-20 text-center text-gray-400">
              没有定向回答
            </div>

            <div v-for="answer in filteredDirectedAnswers" v-else :key="answer.id" class="bg-white rounded-xl p-4 shadow-sm">
              <div class="flex items-start justify-between gap-3">
                <div class="flex-1">
                  <div class="text-sm font-semibold text-gray-800">{{ getDirectedQuestionTitle(answer.question_id) }}</div>
                  <div class="text-xs text-gray-400 mt-1">
                    学号：{{ answer.student_id }} · 昵称：{{ answer.nickname }} · {{ formatTime(answer.created_at) }}
                  </div>
                </div>
                <div class="flex gap-1">
                  <span
                    class="px-2 py-1 rounded-full text-[10px] font-medium"
                    :class="answer.status === 'visible' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'"
                  >
                    {{ answer.status === 'visible' ? '显示中' : '已隐藏' }}
                  </span>
                  <span
                    class="px-2 py-1 rounded-full text-[10px] font-medium"
                    :class="answer.is_adopted ? 'bg-amber-100 text-amber-600' : 'bg-gray-100 text-gray-500'"
                  >
                    {{ answer.is_adopted ? '已采纳' : '未采纳' }}
                  </span>
                </div>
              </div>

              <div class="mt-3 bg-gray-50 rounded-lg p-3 text-sm text-gray-700 whitespace-pre-wrap">
                {{ answer.answer }}
              </div>

              <div class="flex flex-wrap gap-2 mt-3">
                <van-button size="small" :type="answer.is_adopted ? 'default' : 'primary'" @click="handleDirectedAnswerAdopt(answer)">
                  {{ answer.is_adopted ? '取消采纳' : '采纳此条' }}
                </van-button>
                <van-button size="small" plain :type="answer.status === 'visible' ? 'danger' : 'success'" @click="handleDirectedAnswerHide(answer)">
                  {{ answer.status === 'visible' ? '隐藏' : '恢复显示' }}
                </van-button>
                <van-button size="small" plain type="danger" @click="handleDirectedAnswerDelete(answer.id)">删除</van-button>
              </div>
            </div>
          </div>
        </van-tab>
      </van-tabs>
    </div>
  </div>
</template>

<style scoped>
:deep(.van-nav-bar__title) {
  font-weight: bold;
}
</style>
