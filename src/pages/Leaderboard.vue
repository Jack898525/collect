<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { supabase } from '../utils/supabase'
import { showToast } from 'vant'

interface LeaderboardUser {
  rank: number
  nickname: string
  studentId: string // 隐藏字段，用于搜索
  adoptedCount: number
  totalAnswers: number
}

const leaderboardList = ref<LeaderboardUser[]>([])
const loading = ref(true)

// 搜索相关状态
const searchQuery = ref('')
const searchResult = ref<LeaderboardUser | null | 'NOT_FOUND' | 'INVALID_INPUT'>(null)

const onSearch = () => {
  const query = searchQuery.value.trim()
  if (!query) {
    searchResult.value = null
    return
  }

  // 简单的学号校验：检查是否全部为数字
  if (!/^\d+$/.test(query)) {
    searchResult.value = 'INVALID_INPUT'
    return
  }
  
  const found = leaderboardList.value.find(user => user.studentId === query)
  if (found) {
    searchResult.value = found
  } else {
    searchResult.value = 'NOT_FOUND'
  }
}

const onClearSearch = () => {
  searchResult.value = null
}

// 从 Supabase 拉取数据并计算排行榜
const fetchLeaderboard = async () => {
  try {
    loading.value = true
    
    // 拉取所有状态为 visible 的记录，用于统计总回答数
    const { data: allRecords, error: allRecordsError } = await supabase
      .from('qa_records_public')
      .select('student_id, nickname, is_adopted')
      .eq('status', 'visible')

    if (allRecordsError) throw allRecordsError
    
    // 如果没有数据，直接返回
    if (!allRecords || allRecords.length === 0) {
      leaderboardList.value = []
      return
    }

    // 按 student_id 分组统计
    const userStatsMap = new Map<string, { nickname: string, adoptedCount: number, totalAnswers: number }>()

    allRecords.forEach(record => {
      const { student_id, nickname, is_adopted } = record
      
      if (!userStatsMap.has(student_id)) {
        userStatsMap.set(student_id, {
          nickname,
          adoptedCount: 0,
          totalAnswers: 0
        })
      }
      
      const stats = userStatsMap.get(student_id)!
      stats.totalAnswers += 1
      
      if (is_adopted) {
        stats.adoptedCount += 1
      }
    })

    // 转换为数组并排序
    const sortedList: LeaderboardUser[] = Array.from(userStatsMap.entries())
      .filter(([_, user]) => user.adoptedCount > 0) // 只有采纳数大于0才上榜
      .sort((a, b) => b[1].adoptedCount - a[1].adoptedCount) // 按采纳数从高到低排序
      .map(([studentId, user], index) => ({
        rank: index + 1,
        nickname: user.nickname,
        studentId: studentId,
        adoptedCount: user.adoptedCount,
        totalAnswers: user.totalAnswers
      }))

    leaderboardList.value = sortedList
  } catch (err) {
    console.error('获取排行榜数据失败:', err)
    showToast('获取排行榜数据失败')
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchLeaderboard()
})

// 获取排名的特殊样式
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
    <!-- 搜索功能区 -->
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

      <!-- 搜索结果展示 -->
      <div v-if="searchResult" class="px-5 py-4 bg-blue-50/50 border-t border-gray-100">
        <div v-if="searchResult === 'INVALID_INPUT'" class="text-center text-sm text-red-500 py-2 font-medium flex items-center justify-center">
          <van-icon name="warning-o" class="mr-1" />
          请输入正确的学号进行查询
        </div>
        <div v-else-if="searchResult === 'NOT_FOUND'" class="text-center text-sm text-gray-500 py-2">
          未查询到学号“{{ searchQuery }}”的排名，可能是还没有被采纳的经验，继续加油哦！
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
            <span class="text-[10px] text-gray-400 mt-0.5">获采纳数</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 排行榜卡片 -->
    <div class="bg-white rounded-xl shadow-sm overflow-hidden">
      <!-- 头部栏 -->
      <div class="bg-primary/5 px-5 py-4 border-b border-primary/10">
        <h2 class="text-primary font-bold text-lg flex items-center space-x-2">
          <van-icon name="medal" size="24" />
          <span>经验达人榜</span>
        </h2>
        <p class="text-xs text-gray-500 mt-1">按被采纳的解答数量排名</p>
      </div>

      <!-- 列表内容 -->
      <div class="divide-y divide-gray-50 min-h-[200px]">
        <!-- 加载状态 -->
        <div v-if="loading" class="flex justify-center items-center h-40">
          <van-loading type="spinner" color="#3B82F6" size="24px" />
        </div>

        <!-- 空状态 -->
        <div v-else-if="leaderboardList.length === 0" class="flex flex-col items-center justify-center h-40 text-gray-400">
          <van-icon name="info-o" size="32" class="mb-2 text-gray-300" />
          <p class="text-sm">暂无上榜用户，快去分享经验吧！</p>
        </div>

        <div 
          v-else
          v-for="user in leaderboardList" 
          :key="user.rank"
          class="flex items-center justify-between p-5 hover:bg-gray-50/50 transition-colors"
        >
          <!-- 左侧：排名和昵称 -->
          <div class="flex items-center space-x-4">
            <!-- 排名数字圆圈 -->
            <div 
              class="w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm"
              :class="getRankStyle(user.rank)"
            >
              {{ user.rank }}
            </div>
            
            <div class="flex flex-col">
              <span class="font-semibold text-gray-800 text-base">{{ user.nickname }}</span>
              <span class="text-xs text-gray-400 mt-0.5">总回答：{{ user.totalAnswers }}</span>
            </div>
          </div>

          <!-- 右侧：积分/采纳数 -->
          <div class="flex flex-col items-end">
            <div class="flex items-center space-x-1 text-primary">
              <span class="text-xl font-bold">{{ user.adoptedCount }}</span>
              <span class="text-xs font-medium">分</span>
            </div>
            <span class="text-[10px] text-gray-400 mt-0.5">获采纳数</span>
          </div>
        </div>
      </div>
    </div>
    
    <div class="mt-6 text-center text-xs text-gray-400 space-y-1">
      <p class="text-amber-500 font-bold mb-2">⏰ 截止排名时间为 4月24日晚上 23:00</p>
      <p>参与问答，分享经验，你也能上榜！</p>
    </div>
  </div>
</template>
