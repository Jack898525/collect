<script setup lang="ts">
import { ref } from 'vue'
import QADisplay from './QADisplay.vue'
import Leaderboard from './Leaderboard.vue'
import PublishQA from './PublishQA.vue'

const activeTab = ref(0)
const qaDisplayRef = ref<InstanceType<typeof QADisplay> | null>(null)

const onPublishSuccess = () => {
  activeTab.value = 0
  if (qaDisplayRef.value) {
    qaDisplayRef.value.fetchQAList()
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }
}
</script>

<template>
  <!-- 吸顶导航栏 -->
  <van-tabs v-model:active="activeTab" sticky color="#3B82F6" title-active-color="#3B82F6" class="safe-area-top sticky top-0 z-50">
    <van-tab title="QA 展示">
      <QADisplay ref="qaDisplayRef" />
    </van-tab>
    <van-tab title="排行榜">
      <Leaderboard />
    </van-tab>
    <van-tab title="发布 QA">
      <PublishQA @switch-tab="(index) => activeTab = index" @publish-success="onPublishSuccess" />
    </van-tab>
  </van-tabs>
</template>