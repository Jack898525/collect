<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { useMockData } from '../composables/useMockData'
import { getRemainingHours } from '../lib/deadlineNotice'
import { supabase } from '../utils/supabase'

interface QARecord {
  id: string
  nickname: string
  category: string
  sub_category: string
  question: string
  answer: string
  is_adopted: boolean
  is_pinned: boolean
  created_at: string
  likes?: number
}

const RANKING_DEADLINE = '2026-04-24T23:00:00+08:00'

const { categories } = useMockData()
const activeCategory = ref('全部')
const qaList = ref<QARecord[]>([])
const loading = ref(true)
const isNoticeExpanded = ref(false)
const searchQuery = ref('')
const expandedQAs = ref<Set<string>>(new Set())
const remainingHours = ref(getRemainingHours(RANKING_DEADLINE))

let noticeTimer: number | null = null

const toggleQAExpand = (id: string) => {
  if (expandedQAs.value.has(id)) {
    expandedQAs.value.delete(id)
    return
  }

  expandedQAs.value.add(id)
}

const updateRemainingHours = () => {
  remainingHours.value = getRemainingHours(RANKING_DEADLINE)
}

const categoryTabs = computed(() => {
  const tabs = ['全部']
  categories.forEach((category) => tabs.push(category.text))
  return tabs
})

const fetchQAList = async () => {
  try {
    loading.value = true
    const { data, error } = await supabase
      .from('qa_records_public')
      .select('id, nickname, category, sub_category, question, answer, is_adopted, is_pinned, created_at')
      .eq('status', 'visible')
      .order('is_pinned', { ascending: false })
      .order('created_at', { ascending: false })

    if (error) {
      throw error
    }

    qaList.value = (data || []) as QARecord[]
  } catch (err) {
    console.error('Failed to fetch QA records:', err)
  } finally {
    loading.value = false
  }
}

const filteredQAs = computed(() => {
  let result = qaList.value

  if (activeCategory.value !== '全部') {
    result = result.filter((qa) => qa.category === activeCategory.value)
  }

  const query = searchQuery.value.trim().toLowerCase()
  if (query) {
    result = result.filter((qa) => {
      return qa.question.toLowerCase().includes(query) || qa.answer.toLowerCase().includes(query)
    })
  }

  return result
})

const noticeSummary = computed(() => {
  return `距离排行榜截止还有 ${remainingHours.value} 小时，我们新开设了“定向问答”栏目，欢迎大家继续冲榜补充更多有价值的经验内容。`
})

const formatTime = (timeStr: string) => {
  return new Date(timeStr).toLocaleDateString('zh-CN', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

onMounted(() => {
  fetchQAList()
  updateRemainingHours()
  noticeTimer = window.setInterval(updateRemainingHours, 60 * 1000)
})

onUnmounted(() => {
  if (noticeTimer) {
    clearInterval(noticeTimer)
  }
})

defineExpose({
  fetchQAList,
})
</script>

<template>
  <div class="bg-gray-50 min-h-screen safe-area-bottom pb-20">
    <div class="bg-white px-4 py-3 sticky top-[44px] z-50 border-b border-gray-100 shadow-sm flex flex-col space-y-2">
      <div class="text-xs font-bold text-primary flex items-center">
        <van-icon name="search" class="mr-1 text-sm" />
        回答前请先搜索有没有重复问题
      </div>
      <van-search
        v-model="searchQuery"
        placeholder="搜索问题或回答关键词"
        background="#F3F4F6"
        shape="round"
        clearable
        class="!p-0 !bg-transparent search-bar-custom"
      />
    </div>

    <div class="bg-[#fef3c7] text-[#d97706] px-4 py-3 border-b border-amber-200/50 shadow-sm relative">
      <div class="flex items-start">
        <van-icon name="volume-o" class="mt-0.5 mr-2 text-[16px]" />
        <div class="flex-1 text-[13px] leading-relaxed">
          <div class="font-bold mb-1">【系统公告】</div>
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
          <div v-else class="truncate text-[#d97706] pr-10 pb-2">
            {{ noticeSummary }}
          </div>
        </div>
      </div>

      <div
        class="absolute bottom-2 right-4 text-xs font-medium bg-[#fef3c7] px-1 flex items-center space-x-1 cursor-pointer"
        @click="isNoticeExpanded = !isNoticeExpanded"
      >
        <span>{{ isNoticeExpanded ? '收起' : '展开' }}</span>
        <van-icon :name="isNoticeExpanded ? 'arrow-up' : 'arrow-down'" />
      </div>
    </div>

    <div class="bg-white px-4 py-3 sticky top-[110px] z-40 border-b border-gray-100/50 shadow-sm/50 overflow-x-auto whitespace-nowrap hide-scrollbar flex space-x-3">
      <div
        v-for="cat in categoryTabs"
        :key="cat"
        class="inline-flex px-4 py-1.5 rounded-full text-sm font-medium transition-all cursor-pointer"
        :class="[
          activeCategory === cat
            ? 'bg-primary text-white shadow-md shadow-primary/20'
            : 'bg-gray-100 text-gray-600 hover:bg-gray-200',
        ]"
        @click="activeCategory = cat"
      >
        {{ cat }}
      </div>
    </div>

    <div class="p-4 space-y-4">
      <div v-if="loading" class="py-20 flex flex-col items-center justify-center">
        <van-loading type="spinner" color="#3B82F6" size="24px" />
        <p class="text-sm text-gray-400 mt-3">正在加载经验分享...</p>
      </div>

      <div v-else-if="filteredQAs.length === 0" class="py-20 flex flex-col items-center justify-center text-gray-400">
        <van-icon name="info-o" size="48" class="mb-3 text-gray-300" />
        <p>{{ searchQuery ? '未找到相关经验分享' : '该分类下暂无经验分享' }}</p>
      </div>

      <div
        v-for="qa in filteredQAs"
        v-else
        :key="qa.id"
        class="bg-white rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow relative"
      >
        <div v-if="qa.is_pinned" class="absolute -top-2 -right-2 bg-red-500 text-white text-[10px] px-2 py-0.5 rounded-full shadow-sm font-bold z-10 flex items-center">
          <van-icon name="fire" class="mr-0.5" /> 置顶
        </div>

        <div class="flex justify-between items-center mb-3">
          <div class="flex items-center space-x-2 text-xs font-medium">
            <span class="text-primary bg-primary/10 px-2 py-1 rounded-md">
              {{ qa.category }}
            </span>
            <span class="text-gray-400">|</span>
            <span class="text-secondary bg-secondary/10 px-2 py-1 rounded-md">
              {{ qa.sub_category }}
            </span>
          </div>

          <div v-if="qa.is_adopted" class="flex items-center text-xs font-bold text-amber-500 bg-amber-50 px-2 py-1 rounded-full">
            🏆 已采纳
          </div>
        </div>

        <div class="space-y-3 mb-4">
          <h3 class="text-base font-bold text-gray-800 leading-snug">
            <span class="text-primary mr-1">Q:</span>
            {{ qa.question }}
          </h3>
          <div class="relative">
            <p
              class="text-[15px] text-gray-600 leading-relaxed whitespace-pre-wrap transition-all duration-300"
              :class="{ 'line-clamp-5': !expandedQAs.has(qa.id) }"
            >
              <span class="text-secondary font-bold mr-1">A:</span>
              {{ qa.answer }}
            </p>

            <div
              v-if="qa.answer && qa.answer.length > 150"
              class="mt-2 text-primary text-sm font-medium flex items-center cursor-pointer select-none w-fit"
              @click="toggleQAExpand(qa.id)"
            >
              {{ expandedQAs.has(qa.id) ? '收起回答' : '展开全文' }}
              <van-icon :name="expandedQAs.has(qa.id) ? 'arrow-up' : 'arrow-down'" class="ml-1" />
            </div>
          </div>
        </div>

        <div class="flex justify-between items-center text-xs text-gray-400 pt-3 border-t border-gray-50">
          <div class="flex items-center space-x-1">
            <van-icon name="good-job-o" size="16" />
            <span>{{ qa.likes || 0 }}</span>
          </div>
          <div class="flex items-center space-x-2">
            <span class="font-medium text-gray-500">{{ qa.nickname }}</span>
            <span>·</span>
            <span>{{ formatTime(qa.created_at) }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.hide-scrollbar::-webkit-scrollbar {
  display: none;
}

.hide-scrollbar {
  scrollbar-width: none;
  -ms-overflow-style: none;
}

.search-bar-custom {
  border-radius: 9999px;
  border: 2px solid rgba(59, 130, 246, 0.2);
  transition: all 0.3s ease;
}

.search-bar-custom:focus-within {
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

:deep(.van-search__content) {
  background-color: transparent !important;
}

.line-clamp-5 {
  display: -webkit-box;
  -webkit-line-clamp: 5;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>
