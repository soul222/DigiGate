<template>
  <div class="grid grid-cols-1 md:grid-cols-4 gap-6">
    <!-- Total Vehicles -->
    <div class="bg-white rounded-xl shadow-md p-6 border-l-4 border-primary-blue">
      <div class="flex items-center justify-between">
        <div>
          <p class="text-sm font-medium text-gray-600">Total Vehicles</p>
          <p class="text-3xl font-bold text-gray-800 mt-2">{{ stats.totalVehicles }}</p>
        </div>
        <div class="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
          <TruckIcon class="w-6 h-6 text-primary-blue" />
        </div>
      </div>
    </div>

    <!-- Today's Entries -->
    <div class="bg-white rounded-xl shadow-md p-6 border-l-4 border-green-500">
      <div class="flex items-center justify-between">
        <div>
          <p class="text-sm font-medium text-gray-600">Today's Entries</p>
          <p class="text-3xl font-bold text-gray-800 mt-2">{{ stats.todayEntries }}</p>
        </div>
        <div class="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
          <CheckCircleIcon class="w-6 h-6 text-green-500" />
        </div>
      </div>
    </div>

    <!-- Rejected -->
    <div class="bg-white rounded-xl shadow-md p-6 border-l-4 border-primary-red">
      <div class="flex items-center justify-between">
        <div>
          <p class="text-sm font-medium text-gray-600">Rejected</p>
          <p class="text-3xl font-bold text-gray-800 mt-2">{{ stats.todayRejected }}</p>
        </div>
        <div class="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
          <XCircleIcon class="w-6 h-6 text-primary-red" />
        </div>
      </div>
    </div>

    <!-- Gate Status -->
    <div class="bg-white rounded-xl shadow-md p-6 border-l-4 border-gray-500">
      <div class="flex items-center justify-between">
        <div>
          <p class="text-sm font-medium text-gray-600">Gate Status</p>
          <p class="text-xl font-bold mt-2" :class="gateStatus === 'open' ? 'text-green-500' : 'text-gray-800'">
            {{ gateStatus.toUpperCase() }}
          </p>
        </div>
        <div class="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
          <LockClosedIcon class="w-6 h-6 text-gray-600" />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { TruckIcon, CheckCircleIcon, XCircleIcon, LockClosedIcon } from '@heroicons/vue/24/outline'
import { useAppStore } from '@/stores/app'
import { computed } from 'vue'

defineProps({
  stats: {
    type: Object,
    default: () => ({
      totalVehicles: 0,
      todayEntries: 0,
      todayRejected: 0
    })
  }
})

const appStore = useAppStore()
const gateStatus = computed(() => appStore.gateStatus)
</script>