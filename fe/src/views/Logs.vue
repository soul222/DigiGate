<template>
  <div>
    <h1 class="text-3xl font-bold text-gray-800 mb-6">Access Logs</h1>
    <AccessLogs 
      :logs="appStore.recentLogs" 
      :limit="50"
      :show-pagination="true"
    />
  </div>
</template>

<script setup>
import { useAppStore } from '@/stores/app'
import AccessLogs from '@/components/AccessLogs.vue'

const appStore = useAppStore()
</script>