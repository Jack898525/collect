<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useMockData } from '../composables/useMockData'
import { showToast, showSuccessToast, showConfirmDialog, showLoadingToast } from 'vant'
import { supabase } from '../utils/supabase'

const emit = defineEmits(['switch-tab', 'publish-success'])
const { categories } = useMockData()

// 身份信息
const userInfo = ref({
  name: '',
  studentId: '',
  nickname: ''
})

const hasLoadedHistory = ref(false)

// 页面加载时读取历史身份信息
onMounted(() => {
  const savedUserInfo = localStorage.getItem('qa_user_info')
  if (savedUserInfo) {
    try {
      const parsedInfo = JSON.parse(savedUserInfo)
      userInfo.value = {
        name: parsedInfo.name || '',
        studentId: parsedInfo.studentId || '',
        nickname: parsedInfo.nickname || ''
      }
      hasLoadedHistory.value = true
    } catch (e) {
      console.error('解析历史身份信息失败:', e)
    }
  }
})

// QA 列表
const qaList = ref([
  {
    categoryValue: '',
    question: '',
    answer: '',
    showCascader: false,
    cascaderValue: ''
  }
])

const isSubmitting = ref(false)

const onCascaderFinish = ({ selectedOptions }: any, index: number) => {
  qaList.value[index].showCascader = false
  qaList.value[index].categoryValue = selectedOptions.map((opt: any) => opt.text).join('/')
}

const addQaItem = () => {
  qaList.value.push({
    categoryValue: '',
    question: '',
    answer: '',
    showCascader: false,
    cascaderValue: ''
  })
}

const removeQaItem = (index: number) => {
  showConfirmDialog({
    title: '确认删除',
    message: '确定要删除这条经验吗？',
  })
    .then(() => {
      qaList.value.splice(index, 1)
    })
    .catch(() => {
      // on cancel
    })
}

const onSubmit = async () => {
  // 验证身份信息
  if (!userInfo.value.name || !userInfo.value.studentId || !userInfo.value.nickname) {
    showToast('请完善身份信息')
    return
  }

  // 验证 QA 列表
  for (let i = 0; i < qaList.value.length; i++) {
    const item = qaList.value[i]
    if (!item.categoryValue) {
      showToast(`请选择经验 ${i + 1} 的分类`)
      return
    }
    if (!item.question || !item.answer) {
      showToast(`请填写经验 ${i + 1} 的问题和解答内容`)
      return
    }
  }

  try {
    isSubmitting.value = true
    const loadingToast = showLoadingToast({
      message: '正在发布...',
      forbidClick: true,
      duration: 0
    })

    // 构造批量插入的数据
    const recordsToInsert = qaList.value.map(item => {
      const [primary, secondary] = item.categoryValue.split('/')
      return {
        student_name: userInfo.value.name,
        student_id: userInfo.value.studentId,
        nickname: userInfo.value.nickname,
        category: primary,
        sub_category: secondary,
        question: item.question,
        answer: item.answer,
        status: 'visible',
        is_adopted: false
      }
    })

    // 使用 Supabase 批量插入
    const { error } = await supabase
      .from('qa_records')
      .insert(recordsToInsert)

    loadingToast.close()

    if (error) {
      throw error
    }

    // 保存身份信息到 localStorage
    localStorage.setItem('qa_user_info', JSON.stringify({
      name: userInfo.value.name,
      studentId: userInfo.value.studentId,
      nickname: userInfo.value.nickname
    }))
    hasLoadedHistory.value = true

    showSuccessToast('发布成功')
    
    // 清空 QA 列表，保留用户信息以便下次快速填写
    qaList.value = [
      {
        categoryValue: '',
        question: '',
        answer: '',
        showCascader: false,
        cascaderValue: ''
      }
    ]

    // 通知父组件发布成功，触发自动切换 Tab 和刷新数据
    emit('publish-success')
  } catch (err: any) {
    console.error('发布失败:', err)
    showToast({
      message: err.message || '发布失败，请稍后重试',
      type: 'fail'
    })
  } finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <div class="bg-gray-50 min-h-screen p-4 safe-area-bottom pb-20">
    <van-form @submit="onSubmit" class="space-y-4">
      
      <!-- 身份信息区块 -->
      <div class="bg-white rounded-xl shadow-sm overflow-hidden relative">
        <!-- 自动加载提示 -->
        <div v-if="hasLoadedHistory" class="absolute right-0 top-0 bg-primary/10 text-primary text-[10px] px-2 py-0.5 rounded-bl-lg font-medium">
          已自动加载历史信息
        </div>
        
        <div class="px-4 py-3 bg-gray-50/50 border-b border-gray-100 flex items-center justify-between">
          <span class="text-sm font-bold text-gray-700">身份信息</span>
          <span class="text-[10px] text-gray-400">姓名学号仅后台可见，前端不展示</span>
        </div>
        <van-field
          v-model="userInfo.name"
          name="name"
          label="真实姓名"
          placeholder="请输入真实姓名"
          :rules="[{ required: true, message: '请填写真实姓名' }]"
        />
        <van-field
          v-model="userInfo.studentId"
          type="digit"
          name="studentId"
          label="学号"
          placeholder="请输入学号"
          :rules="[{ required: true, message: '请输入学号' }]"
        />
        <van-field
          v-model="userInfo.nickname"
          name="nickname"
          label="展示昵称"
          placeholder="请输入将在前台展示的昵称"
          :rules="[{ required: true, message: '请输入展示昵称' }]"
        />
      </div>

      <!-- QA 列表区块 -->
      <div 
        v-for="(qa, index) in qaList" 
        :key="index"
        class="bg-white rounded-xl shadow-sm overflow-hidden"
      >
        <div class="px-4 py-3 bg-gray-50/50 border-b border-gray-100 flex items-center justify-between">
          <span class="text-sm font-bold text-primary">经验 {{ index + 1 }}</span>
          <van-icon 
            v-if="qaList.length > 1" 
            name="delete-o" 
            class="text-red-500 text-lg cursor-pointer" 
            @click="removeQaItem(index)" 
          />
        </div>

        <!-- 经验分类 -->
        <van-field
          v-model="qa.categoryValue"
          is-link
          readonly
          :name="'categoryValue' + index"
          label="经验分类"
          placeholder="请选择一级和二级分类"
          @click="qa.showCascader = true"
          :rules="[{ required: true, message: '请选择经验分类' }]"
        />
        <van-popup v-model:show="qa.showCascader" round position="bottom" class="safe-area-bottom">
          <van-cascader
            v-model="qa.cascaderValue"
            title="请选择经验分类"
            :options="categories"
            @close="qa.showCascader = false"
            @finish="(val) => onCascaderFinish(val, index)"
            active-color="#3B82F6"
          />
        </van-popup>

        <!-- 经验详情 -->
        <div class="border-t border-gray-50"></div>
        <van-field
          v-model="qa.question"
          :name="'question' + index"
          label="遇到的问题"
          type="textarea"
          rows="2"
          autosize
          placeholder="请简明扼要地描述遇到的问题"
          :rules="[{ required: true, message: '请填写问题' }]"
          label-align="top"
        />
        <div class="border-t border-gray-50"></div>
        <van-field
          v-model="qa.answer"
          :name="'answer' + index"
          label="经验解答"
          type="textarea"
          rows="4"
          autosize
          placeholder="请详细分享您的经验和解答，帮助更多新生"
          :rules="[{ required: true, message: '请填写解答' }]"
          label-align="top"
        />
      </div>

      <!-- 添加经验按钮 -->
      <div class="pt-2 pb-2">
        <van-button 
          type="default" 
          block 
          round
          icon="plus" 
          class="border-dashed border-primary text-primary"
          @click="addQaItem"
        >
          再添加一条经验
        </van-button>
      </div>

      <!-- 提交按钮 -->
      <div class="pt-4 pb-4">
        <van-button 
          round 
          block 
          type="primary" 
          native-type="submit" 
          color="#3B82F6"
          :loading="isSubmitting"
          loading-text="正在发布..."
          class="shadow-md shadow-primary/30 font-bold"
        >
          提交并分享经验
        </van-button>
      </div>
    </van-form>
  </div>
</template>

<style scoped>
/* 定制输入框样式更贴合 iOS 风格 */
:deep(.van-field__label) {
  color: #4b5563;
  font-weight: 500;
}
:deep(.van-cell) {
  padding: 16px;
}
</style>
