<script setup lang="ts">
import { useMockData } from '../composables/useMockData'
import { ref, computed, onMounted } from 'vue'
import { supabase } from '../utils/supabase'

const { categories } = useMockData()
const activeCategory = ref('全部')
const qaList = ref<any[]>([])
const loading = ref(true)
const isNoticeExpanded = ref(false) // 默认收起
const searchQuery = ref('') // 搜索关键词

// 展平所有一级分类用于顶部筛选栏
const categoryTabs = computed(() => {
  const tabs = ['全部']
  categories.forEach(cat => tabs.push(cat.text))
  return tabs
})

// 从 Supabase 拉取数据
const fetchQAList = async () => {
  try {
    loading.value = true
    const { data, error } = await supabase
      .from('qa_records')
      .select('*')
      .eq('status', 'visible')
      .order('created_at', { ascending: false })

    if (error) throw error
    qaList.value = data || []
  } catch (err) {
    console.error('获取经验列表失败:', err)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchQAList()
})

// 筛选后的 QA 列表
const filteredQAs = computed(() => {
  let result = qaList.value

  // 1. 分类过滤
  if (activeCategory.value !== '全部') {
    result = result.filter(qa => qa.category === activeCategory.value)
  }

  // 2. 关键词搜索过滤
  const query = searchQuery.value.trim().toLowerCase()
  if (query) {
    result = result.filter(qa => {
      const q = qa.question ? qa.question.toLowerCase() : ''
      const a = qa.answer ? qa.answer.toLowerCase() : ''
      return q.includes(query) || a.includes(query)
    })
  }

  return result
})

// 格式化时间辅助函数
const formatTime = (timeStr: string) => {
  return new Date(timeStr).toLocaleDateString('zh-CN', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

// 暴露拉取数据方法给父组件
defineExpose({
  fetchQAList
})
</script>

<template>
  <div class="bg-gray-50 min-h-screen safe-area-bottom pb-20">
    <!-- 搜索框区域 -->
    <div class="bg-white px-4 py-3 sticky top-[44px] z-50 border-b border-gray-100 shadow-sm flex flex-col space-y-2">
      <div class="text-xs font-bold text-primary flex items-center">
        <van-icon name="search" class="mr-1 text-sm" />
        回答前请先搜索有无重复回答
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

    <!-- 自定义可展开收起的多行公告 -->
    <div class="bg-[#fef3c7] text-[#d97706] px-4 py-3 border-b border-amber-200/50 shadow-sm relative">
      <div class="flex items-start">
        <van-icon name="volume-o" class="mt-0.5 mr-2 text-[16px]" />
        <div class="flex-1 text-[13px] leading-relaxed">
          <div class="font-bold mb-1">【系统公告】</div>
          <div v-if="isNoticeExpanded" class="space-y-1.5 pb-4">
            <p>1. 回答前先点击搜索框查询你要发布问题的关键词，如果已经有被采纳的可以换一个问题，也可以选择更详细一下该回答，避免重复数据。</p>
            <p>2. 管理员后台不定时上线采纳优质答案，推荐回答详细，问题描述清楚更容易被采纳；</p>
            <p>3. 部分一直没被采纳的回答就是过于简短了，后面的同学们可以对回答进行补充，相同问题将优先采纳详细且时间发布靠前的回答；</p>
            <p>4. 本回答收集禁止包含违反校规的元素，最终采纳解释权归训练平台所有。</p>
            <p class="font-bold">5. 截止排名时间为 4月24日晚上23:00。</p>
          </div>
          <div v-else class="truncate text-[#d97706] pr-10 pb-2">
            1. 回答前先点击搜索框查询你要发布问题的关键词，如果已经有被采纳的可以换一个问题...
          </div>
        </div>
      </div>
      
      <!-- 展开/收起按钮 -->
      <div 
        class="absolute bottom-2 right-4 text-xs font-medium bg-[#fef3c7] px-1 flex items-center space-x-1 cursor-pointer"
        @click="isNoticeExpanded = !isNoticeExpanded"
      >
        <span>{{ isNoticeExpanded ? '收起' : '展开' }}</span>
        <van-icon :name="isNoticeExpanded ? 'arrow-up' : 'arrow-down'" />
      </div>
    </div>

    <!-- 分类筛选横向滚动条 -->
    <div class="bg-white px-4 py-3 sticky top-[110px] z-40 border-b border-gray-100/50 shadow-sm/50 overflow-x-auto whitespace-nowrap hide-scrollbar flex space-x-3">
      <div 
        v-for="cat in categoryTabs" 
        :key="cat"
        @click="activeCategory = cat"
        class="inline-flex px-4 py-1.5 rounded-full text-sm font-medium transition-all cursor-pointer"
        :class="[
          activeCategory === cat 
            ? 'bg-primary text-white shadow-md shadow-primary/20' 
            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
        ]"
      >
        {{ cat }}
      </div>
    </div>

    <!-- QA 列表信息流 -->
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
        v-else
        v-for="qa in filteredQAs" 
        :key="qa.id"
        class="bg-white rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow"
      >
        <!-- 卡片顶部：分类标签与徽章 -->
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

        <!-- 主体内容：问答 -->
        <div class="space-y-3 mb-4">
          <h3 class="text-base font-bold text-gray-800 leading-snug">
            <span class="text-primary mr-1">Q:</span>
            {{ qa.question }}
          </h3>
          <p class="text-[15px] text-gray-600 leading-relaxed">
            <span class="text-secondary font-bold mr-1">A:</span>
            {{ qa.answer }}
          </p>
        </div>

        <!-- 底部信息：发布者和时间 -->
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
/* 隐藏横向滚动条但保留滚动功能 */
.hide-scrollbar::-webkit-scrollbar {
  display: none;
}
.hide-scrollbar {
  scrollbar-width: none;
  -ms-overflow-style: none;
}

/* 自定义搜索框更醒目的样式 */
.search-bar-custom {
  border-radius: 9999px;
  border: 2px solid rgba(59, 130, 246, 0.2); /* 浅蓝色边框 */
  transition: all 0.3s ease;
}
.search-bar-custom:focus-within {
  border-color: #3B82F6; /* 获取焦点时加深蓝边框 */
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}
:deep(.van-search__content) {
  background-color: transparent !important;
}
</style>
