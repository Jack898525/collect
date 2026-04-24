<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { showToast } from 'vant'
import { buildLeaderboard, type LeaderboardRow, type ScoreRecord } from '../lib/leaderboard'
import { supabase } from '../utils/supabase'

const leaderboardList = ref<LeaderboardRow[]>([])
const loading = ref(true)
const searchQuery = ref('')
const searchResult = ref<LeaderboardRow | null | 'NOT_FOUND' | 'INVALID_INPUT'>(null)

const onSearch = () => {
  const query = searchQuery.value.trim()
  if (!query) {
    searchResult.value = null
    return
  }

  if (!/^\d+$/.test(query)) {
    searchResult.value = 'INVALID_INPUT'
    return
  }

  const found = leaderboardList.value.find((user) => user.studentId === query)
  searchResult.value = found || 'NOT_FOUND'
}

const onClearSearch = () => {
  searchResult.value = null
}

const fetchLeaderboard = async () => {
  try {
    loading.value = true

    const [{ data: qaRecords, error: qaError }, { data: directedRecords, error: directedError }] =
      await Promise.all([
        supabase
          .from('qa_records_public')
          .select('student_id, nickname, is_adopted')
          .eq('status', 'visible'),
        supabase
          .from('directed_answers_public')
          .select('student_id, nickname, is_adopted')
          .eq('status', 'visible'),
      ])

    if (qaError) {
      throw qaError
    }

    if (directedError) {
      throw directedError
    }

    leaderboardList.value = buildLeaderboard(
      (qaRecords || []) as ScoreRecord[],
      (directedRecords || []) as ScoreRecord[],
    )
  } catch (err) {
    console.error('Failed to load leaderboard:', err)
    showToast('获取排行榜失败')
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchLeaderboard()
})

const getRankStyle = (rank: number) => {
  switch (rank) {
    case 1:
      return 'bg-yellow-400 text-white shadow-md shadow-yellow-200'
    case 2:
      return 'bg-gray-300 text-white shadow-md shadow-gray-200'
    case 3:
      return 'bg-amber-600 text-white shadow-md shadow-amber-200'
    default:
      return 'bg-gray-100 text-gray-500 font-normal'
  }
}
</script>

<template>
  <div class="p-4 safe-area-bottom pb-20 space-y-4">
    <div class="bg-white rounded-xl shadow-sm overflow-hidden">
      <form action="/">
        <van-search
          v-model="searchQuery"
          show-action
          placeholder="请输入学号查询你的排名"
          @search="onSearch"
          @clear="onClearSearch"
        >
          <template #action>
            <div @click="onSearch" class="text-primary font-medium">查询</div>
          </template>
        </van-search>
      </form>

      <div v-if="searchResult" class="px-5 py-4 bg-blue-50/50 border-t border-gray-100">
        <div
          v-if="searchResult === 'INVALID_INPUT'"
          class="text-center text-sm text-red-500 py-2 font-medium flex items-center justify-center"
        >
          <van-icon name="warning-o" class="mr-1" />
          请输入正确的学号
        </div>
        <div v-else-if="searchResult === 'NOT_FOUND'" class="text-center text-sm text-gray-500 py-2">
          没查到当前学号的排名，可能还没有被采纳的回答。
        </div>
        <div v-else class="flex items-center justify-between">
          <div class="flex items-center space-x-4">
            <div
              class="w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm"
              :class="getRankStyle(searchResult.rank)"
            >
              {{ searchResult.rank }}
            </div>
            <div class="flex flex-col">
              <span class="font-semibold text-gray-800 text-base">
                {{ searchResult.nickname }}
                <span class="text-xs text-gray-400 font-normal ml-1">(你的排名)</span>
              </span>
              <span class="text-xs text-gray-400 mt-0.5">总回答：{{ searchResult.totalAnswers }}</span>
            </div>
          </div>
          <div class="flex flex-col items-end">
            <div class="flex items-center space-x-1 text-primary">
              <span class="text-xl font-bold">{{ searchResult.adoptedCount }}</span>
              <span class="text-xs font-medium">分</span>
            </div>
            <span class="text-[10px] text-gray-400 mt-0.5">总采纳数</span>
          </div>
        </div>
      </div>
    </div>

    <div class="bg-white rounded-xl shadow-sm overflow-hidden">
      <div class="bg-primary/5 px-5 py-4 border-b border-primary/10">
        <h2 class="text-primary font-bold text-lg flex items-center space-x-2">
          <van-icon name="medal" size="24" />
          <span>经验达人榜</span>
        </h2>
        <p class="text-xs text-gray-500 mt-1">自由 QA 与定向问答的采纳数合并排名</p>
      </div>

      <div class="divide-y divide-gray-50 min-h-[200px]">
        <div v-if="loading" class="flex justify-center items-center h-40">
          <van-loading type="spinner" color="#3B82F6" size="24px" />
        </div>

        <div v-else-if="leaderboardList.length === 0" class="flex flex-col items-center justify-center h-40 text-gray-400">
          <van-icon name="info-o" size="32" class="mb-2 text-gray-300" />
          <p class="text-sm">暂时还没有上榜用户</p>
        </div>

        <div
          v-for="user in leaderboardList"
          v-else
          :key="user.rank"
          class="flex items-center justify-between p-5 hover:bg-gray-50/50 transition-colors"
        >
          <div class="flex items-center space-x-4">
            <div class="w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm" :class="getRankStyle(user.rank)">
              {{ user.rank }}
            </div>
            <div class="flex flex-col">
              <span class="font-semibold text-gray-800 text-base">{{ user.nickname }}</span>
              <span class="text-xs text-gray-400 mt-0.5">总回答：{{ user.totalAnswers }}</span>
            </div>
          </div>

          <div class="flex flex-col items-end">
            <div class="flex items-center space-x-1 text-primary">
              <span class="text-xl font-bold">{{ user.adoptedCount }}</span>
              <span class="text-xs font-medium">分</span>
            </div>
            <span class="text-[10px] text-gray-400 mt-0.5">总采纳数</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
