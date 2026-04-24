<script setup lang="ts">
import { ref } from 'vue'

</script>

<template>
  <div class="min-h-screen bg-gray-50 flex flex-col">
    <router-view />
  </div>
</template>

<style>
/* Vant 样式覆盖，保持简约现代 */
.van-tabs__nav {
  background-color: rgba(255, 255, 255, 0.9) !important;
  backdrop-filter: blur(8px);
}
.van-tab {
  font-weight: 500;
}
/* 强制隐藏 Trae 的自带水印图标 */
#trae-badge-plugin {
  display: none !important;
}
</style>
