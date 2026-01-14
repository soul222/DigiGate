<template>
  <div class="bg-white rounded-xl shadow-md p-6">
    <div class="flex items-center justify-between mb-6">
      <h2 class="text-xl font-bold text-gray-800">
        {{ showPagination ? 'Access Logs' : 'Recent Activity' }}
      </h2>
      <router-link 
        v-if="!showPagination" 
        to="/logs" 
        class="text-primary-blue hover:text-blue-700 text-sm font-semibold"
      >
        View All →
      </router-link>
    </div>

    <!-- Filters (only for full page) -->
    <div v-if="showPagination" class="mb-6 flex items-center space-x-4">
      <select 
        v-model="filterType"
        class="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-blue"
      >
        <option value="all">All Types</option>
        <option value="entry">Entry</option>
        <option value="exit">Exit</option>
      </select>

      <select 
        v-model="filterStatus"
        class="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-blue"
      >
        <option value="all">All Status</option>
        <option value="opened">Opened</option>
        <option value="rejected">Rejected</option>
      </select>

      <input
        v-model="searchQuery"
        type="text"
        placeholder="Search plate number..."
        class="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-blue"
      />
    </div>

    <!-- Logs List -->
    <div class="space-y-3">
      <div
        v-for="log in displayedLogs"
        :key="log.id"
        class="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition cursor-pointer"
        @click="viewDetails(log)"
      >
        <div class="flex items-center space-x-4 flex-1">
          <!-- Status Icon -->
          <div :class="[
            'w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0',
            log.gate_status === 'opened' ? 'bg-green-100' : 'bg-red-100'
          ]">
            <svg
              v-if="log.gate_status === 'opened'"
              class="w-6 h-6 text-green-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <svg
              v-else
              class="w-6 h-6 text-red-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          
          <!-- Info -->
          <div class="flex-1">
            <p class="font-semibold text-gray-800">{{ log.plate_number }}</p>
            <p class="text-sm text-gray-500">
              {{ log.vehicles?.owner_name || 'Unknown Vehicle' }} • {{ formatTime(log.timestamp) }}
            </p>
          </div>
        </div>

        <!-- Status & Confidence -->
        <div class="text-right">
          <span
            :class="[
              'inline-block px-3 py-1 rounded-full text-xs font-semibold',
              log.gate_status === 'opened'
                ? 'bg-green-100 text-green-800'
                : 'bg-red-100 text-red-800'
            ]"
          >
            {{ log.gate_status.toUpperCase() }}
          </span>
          <p class="text-xs text-gray-500 mt-1">
            {{ (log.confidence * 100).toFixed(1) }}% confidence
          </p>
        </div>
      </div>

      <!-- Empty State -->
      <div v-if="displayedLogs.length === 0" class="text-center py-12">
        <svg class="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        <p class="text-gray-500 font-medium">No access logs found</p>
      </div>
    </div>

    <!-- Pagination -->
    <div v-if="showPagination && totalPages > 1" class="mt-6 flex items-center justify-between">
      <p class="text-sm text-gray-600">
        Showing {{ startIndex + 1 }}-{{ endIndex }} of {{ filteredLogs.length }}
      </p>
      
      <div class="flex space-x-2">
        <button
          @click="currentPage--"
          :disabled="currentPage === 1"
          class="px-3 py-1 border rounded disabled:opacity-50"
        >
          Previous
        </button>
        <button
          @click="currentPage++"
          :disabled="currentPage === totalPages"
          class="px-3 py-1 border rounded disabled:opacity-50"
        >
          Next
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'

const props = defineProps({
  logs: {
    type: Array,
    default: () => []
  },
  limit: {
    type: Number,
    default: 10
  },
  showPagination: {
    type: Boolean,
    default: false
  }
})

const router = useRouter()

const filterType = ref('all')
const filterStatus = ref('all')
const searchQuery = ref('')
const currentPage = ref(1)
const itemsPerPage = ref(props.limit)

const filteredLogs = computed(() => {
  let result = props.logs

  if (filterType.value !== 'all') {
    result = result.filter(log => log.access_type === filterType.value)
  }

  if (filterStatus.value !== 'all') {
    result = result.filter(log => log.gate_status === filterStatus.value)
  }

  if (searchQuery.value) {
    result = result.filter(log => 
      log.plate_number.toLowerCase().includes(searchQuery.value.toLowerCase())
    )
  }

  return result
})

const totalPages = computed(() => 
  Math.ceil(filteredLogs.value.length / itemsPerPage.value)
)

const startIndex = computed(() => 
  (currentPage.value - 1) * itemsPerPage.value
)

const endIndex = computed(() => 
  Math.min(startIndex.value + itemsPerPage.value, filteredLogs.value.length)
)

const displayedLogs = computed(() => {
  if (props.showPagination) {
    return filteredLogs.value.slice(startIndex.value, endIndex.value)
  }
  return filteredLogs.value.slice(0, props.limit)
})

const formatTime = (timestamp) => {
  const date = new Date(timestamp)
  return date.toLocaleString('id-ID', {
    hour: '2-digit',
    minute: '2-digit',
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  })
}

const viewDetails = (log) => {
  console.log('View log details:', log)
  // You can open a modal or navigate to details page
}
</script>