import { ref } from 'vue'

export interface QAItem {
  id: string
  category: {
    primary: string
    secondary: string
  }
  question: string
  answer: string
  author: {
    nickname: string
  }
  isAdopted: boolean
  createdAt: string
  likes: number
}

export interface LeaderboardUser {
  rank: number
  nickname: string
  adoptedCount: number
  totalAnswers: number
}

// 提取为全局状态，保证不同组件间数据同步
const qasList = ref<QAItem[]>([
  {
    id: '1',
    category: {
      primary: '学业发展',
      secondary: '选课建议'
    },
    question: '新生第一学期应该选多少学分比较合适？',
    answer: '建议新生第一学期选课在20-25学分左右。不要贪多，刚开学需要时间适应大学节奏。重点把必修课选上，可以搭配1-2门感兴趣的通识选修课。如果觉得吃力，可以在试听周退掉部分选修课。',
    author: {
      nickname: '学长A'
    },
    isAdopted: true,
    createdAt: '2023-09-01 10:00',
    likes: 128
  },
  {
    id: '2',
    category: {
      primary: '校内生活',
      secondary: '食堂推荐'
    },
    question: '哪个食堂的饭菜最好吃？有没有特别推荐的档口？',
    answer: '强烈推荐第二食堂二楼的石锅拌饭和麻辣香锅！价格实惠而且分量很足。另外第三食堂一楼的早餐很不错，尤其是肉包子和豆浆，不过要早点去，去晚了就卖光了。',
    author: {
      nickname: '干饭王'
    },
    isAdopted: false,
    createdAt: '2023-09-02 12:30',
    likes: 85
  },
  {
    id: '3',
    category: {
      primary: '信息获取与办事',
      secondary: '证件办理'
    },
    question: '校园卡丢失了怎么办？去哪里补办？',
    answer: '校园卡丢失后，第一步先在校园APP或者圈存机上进行挂失，防止被盗刷。第二步带上身份证或者学生证去综合服务大厅（行政楼一楼）的校园卡服务窗口补办，补办需要缴纳20元工本费，当场就能拿到新卡。',
    author: {
      nickname: '百事通'
    },
    isAdopted: true,
    createdAt: '2023-09-05 15:45',
    likes: 210
  }
])

const leaderboardList = ref<LeaderboardUser[]>([
  { rank: 1, nickname: '百事通', adoptedCount: 156, totalAnswers: 200 },
  { rank: 2, nickname: '学长A', adoptedCount: 120, totalAnswers: 150 },
  { rank: 3, nickname: '答题小能手', adoptedCount: 98, totalAnswers: 120 },
  { rank: 4, nickname: '干饭王', adoptedCount: 85, totalAnswers: 100 },
  { rank: 5, nickname: '深夜哲学家', adoptedCount: 60, totalAnswers: 80 },
  { rank: 6, nickname: '图书馆常客', adoptedCount: 45, totalAnswers: 60 },
])

const categories = [
  {
    text: '学业发展',
    value: '学业发展',
    children: [
      { text: '选课建议', value: '选课建议' },
      { text: '学习方法', value: '学习方法' },
      { text: '考试技巧', value: '考试技巧' },
      { text: '专业选择', value: '专业选择' },
      { text: '其他', value: '其他' }
    ]
  },
  {
    text: '校内生活',
    value: '校内生活',
    children: [
      { text: '宿舍生活', value: '宿舍生活' },
      { text: '食堂推荐', value: '食堂推荐' },
      { text: '社团活动', value: '社团活动' },
      { text: '校园设施', value: '校园设施' },
      { text: '其他', value: '其他' }
    ]
  },
  {
    text: '校外娱乐与生活',
    value: '校外娱乐与生活',
    children: [
      { text: '周边美食', value: '周边美食' },
      { text: '交通便利', value: '交通便利' },
      { text: '购物推荐', value: '购物推荐' },
      { text: '娱乐场所', value: '娱乐场所' },
      { text: '其他', value: '其他' }
    ]
  },
  {
    text: '信息获取与办事',
    value: '信息获取与办事',
    children: [
      { text: '教务系统', value: '教务系统' },
      { text: '图书馆使用', value: '图书馆使用' },
      { text: '证件办理', value: '证件办理' },
      { text: '奖学金申请', value: '奖学金申请' },
      { text: '其他', value: '其他' }
    ]
  },
  {
    text: '其他',
    value: '其他',
    children: [
      { text: '通用建议', value: '通用建议' },
      { text: '心理调适', value: '心理调适' },
      { text: '时间规划', value: '时间规划' },
      { text: '其他', value: '其他' }
    ]
  }
]

export function useMockData() {
  const addQA = (qa: QAItem) => {
    qasList.value.unshift(qa)
  }

  return {
    qasList,
    leaderboardList,
    categories,
    addQA
  }
}
