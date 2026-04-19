<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { showToast } from 'vant'
import { supabase } from '../utils/supabase'

const router = useRouter()
const qaList = ref<any[]>([])
const loading = ref(true)

// 自定义密码弹窗逻辑
const password = ref('')
const showPasswordDialog = ref(true)

onMounted(() => {
  // 不再使用函数式调用 showDialog，因为我们已经在 template 中写了 <van-dialog> 组件
  // 只需要让 showPasswordDialog 初始为 true 即可显示 template 中的弹窗
})

const beforeClose = (action: string) => {
  if (action === 'cancel') {
    router.replace('/')
    return true
  }
  
  if (password.value === 'Admin2025') {
    fetchAllQA()
    return true
  } else {
    showToast('口令错误')
    password.value = ''
    return false // 阻止弹窗关闭
  }
}

// 获取所有数据
const fetchAllQA = async () => {
  try {
    loading.value = true
    const { data, error } = await supabase
      .from('qa_records')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) throw error
    qaList.value = data || []
  } catch (err) {
    console.error('获取所有记录失败:', err)
    showToast('获取数据失败')
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
    
    showToast(newStatus ? '已设为采纳' : '已取消采纳')
  } catch (err) {
    console.error('更新采纳状态失败:', err)
    showToast('操作失败')
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
    
    showToast(newStatus === 'hidden' ? '已隐藏该记录' : '已恢复显示')
  } catch (err) {
    console.error('更新隐藏状态失败:', err)
    showToast('操作失败')
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
    <!-- 密码验证弹窗 -->
    <van-dialog 
      v-model:show="showPasswordDialog" 
      title="管理员验证" 
      show-cancel-button
      :before-close="beforeClose"
      confirm-button-text="进入"
      cancel-button-text="返回首页"
      confirm-button-color="#3B82F6"
    >
      <div class="p-4 text-center">
        <p class="text-sm text-gray-500 mb-4">请输入管理员口令进入后台</p>
        <van-field
          v-model="password"
          type="password"
          placeholder="请输入管理员口令"
          input-align="center"
          class="border border-gray-200 rounded-lg"
        />
      </div>
    </van-dialog>

    <!-- 后台主界面 -->
    <div v-if="!showPasswordDialog" class="safe-area-top">
      <van-nav-bar title="数据管理后台" class="sticky top-0 z-50 bg-white/90 backdrop-blur-md" />

      <div class="p-4 space-y-4">
        <div v-if="loading" class="py-20 flex justify-center">
          <van-loading type="spinner" color="#3B82F6" />
        </div>

        <div v-else-if="qaList.length === 0" class="py-20 text-center text-gray-400">
          暂无任何数据
        </div>

        <!-- 审核卡片列表 -->
        <div 
          v-else
          v-for="qa in qaList" 
          :key="qa.id"
          class="bg-white rounded-xl p-4 shadow-sm"
        >
          <!-- 卡片头部信息 -->
          <div class="flex justify-between items-start mb-2">
            <div class="text-xs text-gray-500">
              <span class="font-bold text-gray-700 mr-2">{{ qa.student_name }}</span>
              <span>{{ qa.student_id }}</span>
              <span class="mx-1">·</span>
              <span>{{ qa.nickname }}</span>
            </div>
            <div class="flex space-x-1 text-[10px]">
              <span 
                class="px-2 py-0.5 rounded"
                :class="qa.status === 'visible' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'"
              >
                {{ qa.status === 'visible' ? '显示中' : '已隐藏' }}
              </span>
            </div>
          </div>

          <!-- 问答内容 -->
          <div class="bg-gray-50 p-3 rounded-lg text-sm mb-3">
            <div class="font-bold text-gray-800 mb-1">
              <span class="text-primary mr-1">Q:</span>{{ qa.question }}
            </div>
            <div class="text-gray-600">
              <span class="text-secondary font-bold mr-1">A:</span>{{ qa.answer }}
            </div>
            <div class="text-xs text-gray-400 mt-2 text-right">
              发布于 {{ formatTime(qa.created_at) }}
            </div>
          </div>

          <!-- 操作按钮区 -->
          <div class="flex justify-end space-x-2 pt-2 border-t border-gray-100">
            <van-button 
              size="small" 
              plain 
              :type="qa.status === 'hidden' ? 'success' : 'danger'"
              @click="handleHide(qa.id, qa.status)"
            >
              {{ qa.status === 'hidden' ? '取消隐藏' : '隐藏' }}
            </van-button>
            <van-button 
              size="small" 
              :type="qa.is_adopted ? 'default' : 'primary'"
              :color="qa.is_adopted ? '#9CA3AF' : '#F59E0B'"
              class="border-none"
              @click="handleAdopt(qa.id, qa.is_adopted)"
            >
              {{ qa.is_adopted ? '取消采纳' : '设为采纳' }}
            </van-button>
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
:deep(.van-dialog__header) {
  font-weight: bold;
  font-size: 18px;
}
:deep(.van-dialog__cancel) {
  color: #64748b;
}
</style>