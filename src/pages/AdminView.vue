<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { showToast, showConfirmDialog } from 'vant'
import { supabase } from '../utils/supabase'

const router = useRouter()
const qaList = ref<any[]>([])
const loading = ref(true)
const searchQuery = ref('')

// 筛选后的列表
const filteredQAList = computed(() => {
  const query = searchQuery.value.trim().toLowerCase()
  if (!query) return qaList.value
  
  return qaList.value.filter(qa => {
    const q = qa.question ? qa.question.toLowerCase() : ''
    const a = qa.answer ? qa.answer.toLowerCase() : ''
    const nick = qa.nickname ? qa.nickname.toLowerCase() : ''
    return q.includes(query) || a.includes(query) || nick.includes(query)
  })
})

onMounted(() => {
  fetchAllQA()
})

// 获取所有数据
const fetchAllQA = async () => {
  try {
    loading.value = true
    const { data, error } = await supabase
      .from('qa_records')
      .select('id, student_id, nickname, category, sub_category, question, answer, status, is_adopted, is_pinned, created_at')
      .order('is_pinned', { ascending: false })
      .order('created_at', { ascending: false })

    if (error) throw error
    qaList.value = data || []
  } catch (err) {
    console.error('Failed to fetch records:', err)
    showToast('Failed to load data')
  } finally {
    loading.value = false
  }
}

// 采纳操作
const handleAdopt = async (id: string, currentStatus: boolean) => {
  const newStatus = !currentStatus
  try {
    const { error } = await supabase
      .from('qa_records')
      .update({ is_adopted: newStatus })
      .eq('id', id)

    if (error) throw error
    
    // 更新本地状态
    const item = qaList.value.find(q => q.id === id)
    if (item) item.is_adopted = newStatus
    
    showToast(newStatus ? 'Success' : 'Success')
  } catch (err) {
    console.error('Failed to update adopt status:', err)
    showToast('Failed')
  }
}

// 隐藏操作
const handleHide = async (id: string, currentStatus: string) => {
  const newStatus = currentStatus === 'visible' ? 'hidden' : 'visible'
  try {
    const { error } = await supabase
      .from('qa_records')
      .update({ status: newStatus })
      .eq('id', id)

    if (error) throw error
    
    // 更新本地状态
    const item = qaList.value.find(q => q.id === id)
    if (item) item.status = newStatus
    
    showToast(newStatus === 'hidden' ? 'Success' : 'Success')
  } catch (err) {
    console.error('Failed to update hide status:', err)
    showToast('Failed')
  }
}

// 删除操作
const handleDelete = (id: string) => {
  showConfirmDialog({
    title: 'Confirm',
    message: 'Are you sure?',
  })
    .then(async () => {
      try {
        const { error } = await supabase
          .from('qa_records')
          .delete()
          .eq('id', id)

        if (error) throw error
        
        // 更新本地状态
        qaList.value = qaList.value.filter(q => q.id !== id)
        showToast('Success')
      } catch (err) {
        console.error('Failed to delete:', err)
        showToast('Failed')
      }
    })
    .catch(() => {
      // on cancel
    })
}

// 置顶操作
const handlePin = async (id: string, currentPinned: boolean) => {
  const newPinnedStatus = !currentPinned
  try {
    const { error } = await supabase
      .from('qa_records')
      .update({ is_pinned: newPinnedStatus })
      .eq('id', id)

    if (error) throw error
    
    // 更新本地状态
    const item = qaList.value.find(q => q.id === id)
    if (item) item.is_pinned = newPinnedStatus
    
    showToast(newPinnedStatus ? 'Success' : 'Success')
  } catch (err) {
    console.error('Failed to update pin status:', err)
    showToast('Failed')
  }
}

// 格式化时间
const formatTime = (timeStr: string) => {
  return new Date(timeStr).toLocaleString('zh-CN', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}
</script>

<template>
  <div class="min-h-screen bg-gray-50 pb-20">
    <!-- Workspace -->
    <div class="safe-area-top">
      <van-nav-bar title="Workspace" class="sticky top-0 z-50 bg-white/90 backdrop-blur-md" />

      <!-- Search -->
      <div class="bg-white px-3 py-2 sticky top-[46px] z-40 border-b border-gray-100 shadow-sm">
        <van-search
          v-model="searchQuery"
          placeholder="Search items..."
          background="transparent"
          shape="round"
          clearable
          class="!p-0"
        />
      </div>

      <div class="p-4 space-y-4">
        <div v-if="loading" class="py-20 flex justify-center">
          <van-loading type="spinner" color="#3B82F6" />
        </div>

        <div v-else-if="filteredQAList.length === 0" class="py-20 text-center text-gray-400">
          No records
        </div>

        <!-- Cards -->
        <div 
          v-else
          v-for="qa in filteredQAList" 
          :key="qa.id"
          class="bg-white rounded-xl p-4 shadow-sm relative"
        >
          <!-- Badges -->
          <div v-if="qa.is_pinned" class="absolute -top-2 -right-2 bg-red-500 text-white text-[10px] px-2 py-0.5 rounded-full shadow-sm font-bold z-10">
            📌 Pinned
          </div>

          <!-- Header -->
          <div class="flex justify-between items-start mb-2">
            <div class="text-xs text-gray-500">
              <span class="font-bold text-gray-700 mr-2">Student ID: {{ qa.student_id }}</span>
              <span>Nickname: {{ qa.nickname }}</span>
            </div>
            <div class="flex space-x-1 text-[10px]">
              <span 
                class="px-2 py-0.5 rounded"
                :class="qa.status === 'visible' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'"
              >
                {{ qa.status === 'visible' ? 'Ready' : 'Pending' }}
              </span>
            </div>
          </div>

          <!-- Content -->
          <div class="bg-gray-50 p-3 rounded-lg text-sm mb-3">
            <div class="font-bold text-gray-800 mb-1">
              <span class="text-primary mr-1">Q:</span>{{ qa.question }}
            </div>
            <div class="text-gray-600">
              <span class="text-secondary font-bold mr-1">A:</span>{{ qa.answer }}
            </div>
            <div class="text-xs text-gray-400 mt-2 text-right">
              Created At {{ formatTime(qa.created_at) }}
            </div>
          </div>

          <!-- Actions -->
          <div class="flex justify-between items-center pt-3 border-t border-gray-100">
            <div class="flex space-x-2">
              <van-button 
                size="small" 
                type="danger" 
                plain
                icon="delete-o"
                @click="handleDelete(qa.id)"
              >
                Del
              </van-button>
            </div>
            <div class="flex space-x-2">
              <van-button 
                size="small" 
                plain 
                :type="qa.is_pinned ? 'warning' : 'default'"
                @click="handlePin(qa.id, qa.is_pinned)"
              >
                {{ qa.is_pinned ? 'Unpin' : 'Pin' }}
              </van-button>
              <van-button 
                size="small" 
                plain 
                :type="qa.status === 'hidden' ? 'success' : 'danger'"
                @click="handleHide(qa.id, qa.status)"
              >
                {{ qa.status === 'hidden' ? 'Ready' : 'Pending' }}
              </van-button>
              <van-button 
                size="small" 
                :type="qa.is_adopted ? 'default' : 'primary'"
                :color="qa.is_adopted ? '#9CA3AF' : '#F59E0B'"
                class="border-none"
                @click="handleAdopt(qa.id, qa.is_adopted)"
              >
                {{ qa.is_adopted ? 'NO' : 'OK' }}
              </van-button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
:deep(.van-nav-bar__title) {
  font-weight: bold;
}
</style>