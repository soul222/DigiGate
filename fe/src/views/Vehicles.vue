<template>
  <div>
    <h1 class="text-3xl font-bold text-gray-800 mb-6">Vehicle Management</h1>
    <VehicleList 
      :vehicles="appStore.vehicles" 
      @refresh="appStore.loadVehicles"
    />
  </div>
</template>

<script setup>
import { useAppStore } from '@/stores/app'
import VehicleList from '@/components/VehicleList.vue'

const appStore = useAppStore()
</script>