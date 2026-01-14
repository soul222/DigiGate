<template>
  <div>
    <h1 class="text-3xl font-bold text-gray-800 mb-6">Dashboard Overview</h1>
    
    <Statistics :stats="appStore.statistics" />
    
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
      <div class="lg:col-span-1">
        <GateControl @gate-action="handleGateAction" />
      </div>
      
      <div class="lg:col-span-2">
        <AccessLogs :logs="appStore.recentLogs" :limit="10" />
      </div>
    </div>
  </div>
</template>

<script setup>
import { useAppStore } from '@/stores/app'
import Statistics from '@/components/Statistics.vue'
import GateControl from '@/components/GateControl.vue'
import AccessLogs from '@/components/AccessLogs.vue'

const appStore = useAppStore()

const handleGateAction = async (action) => {
  try {
    await appStore.controlGate(action)
  } catch (error) {
    console.error('Error controlling gate:', error)
    alert('Failed to control gate')
  }
}
</script>