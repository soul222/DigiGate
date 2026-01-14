<template>
  <div class="space-y-6">
    <!-- Header Section -->
    <div class="bg-white rounded-xl shadow-md p-6">
      <div class="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h2 class="text-2xl font-bold text-gray-800">Registered Vehicles</h2>
          <p class="text-sm text-gray-600 mt-1">
            Manage authorized vehicles for automatic gate access
          </p>
        </div>
        
        <button
          v-if="userRole === 'admin'"
          @click="showAddModal = true"
          class="bg-primary-blue hover:bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold transition flex items-center space-x-2"
        >
          <PlusIcon class="w-5 h-5" />
          <span>Add Vehicle</span>
        </button>
      </div>

      <!-- Search & Filter Bar -->
      <div class="mt-6 flex flex-col md:flex-row gap-4">
        <!-- Search -->
        <div class="flex-1 relative">
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Search by plate number, owner name, or unit..."
            class="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-blue focus:border-transparent"
          />
          <MagnifyingGlassIcon class="w-5 h-5 text-gray-400 absolute left-3 top-2.5" />
        </div>

        <!-- Status Filter -->
        <select 
          v-model="statusFilter"
          class="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-blue"
        >
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>

        <!-- Export Button -->
        <button
          @click="exportData"
          class="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition flex items-center space-x-2"
        >
          <ArrowDownTrayIcon class="w-5 h-5 text-gray-600" />
          <span class="text-gray-700 font-medium">Export</span>
        </button>
      </div>
    </div>

    <!-- Statistics Cards -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div class="bg-white rounded-xl shadow-md p-6">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm text-gray-600">Total Vehicles</p>
            <p class="text-3xl font-bold text-gray-800 mt-2">{{ vehicles.length }}</p>
          </div>
          <div class="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
            <TruckIcon class="w-6 h-6 text-primary-blue" />
          </div>
        </div>
      </div>

      <div class="bg-white rounded-xl shadow-md p-6">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm text-gray-600">Active</p>
            <p class="text-3xl font-bold text-green-600 mt-2">{{ activeCount }}</p>
          </div>
          <div class="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
            <CheckCircleIcon class="w-6 h-6 text-green-600" />
          </div>
        </div>
      </div>

      <div class="bg-white rounded-xl shadow-md p-6">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm text-gray-600">Inactive</p>
            <p class="text-3xl font-bold text-red-600 mt-2">{{ inactiveCount }}</p>
          </div>
          <div class="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
            <XCircleIcon class="w-6 h-6 text-red-600" />
          </div>
        </div>
      </div>
    </div>

    <!-- Vehicles Table -->
    <div class="bg-white rounded-xl shadow-md overflow-hidden">
      <div class="overflow-x-auto">
        <table class="min-w-full divide-y divide-gray-200">
          <thead class="bg-gray-50">
            <tr>
              <th 
                scope="col" 
                class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                @click="sortBy('plate_number')"
              >
                <div class="flex items-center space-x-1">
                  <span>Plate Number</span>
                  <ChevronUpDownIcon class="w-4 h-4" />
                </div>
              </th>
              <th 
                scope="col" 
                class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                @click="sortBy('owner_name')"
              >
                <div class="flex items-center space-x-1">
                  <span>Owner Name</span>
                  <ChevronUpDownIcon class="w-4 h-4" />
                </div>
              </th>
              <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Unit Number
              </th>
              <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Phone
              </th>
              <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Added Date
              </th>
              <th scope="col" class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody class="bg-white divide-y divide-gray-200">
            <tr 
              v-for="vehicle in paginatedVehicles" 
              :key="vehicle.id" 
              class="hover:bg-gray-50 transition"
            >
              <!-- Plate Number -->
              <td class="px-6 py-4 whitespace-nowrap">
                <div class="flex items-center">
                  <div class="w-10 h-10 bg-primary-blue rounded flex items-center justify-center">
                    <TruckIcon class="w-5 h-5 text-white" />
                  </div>
                  <div class="ml-3">
                    <span class="font-bold text-gray-900 text-lg">{{ vehicle.plate_number }}</span>
                  </div>
                </div>
              </td>

              <!-- Owner Name -->
              <td class="px-6 py-4 whitespace-nowrap">
                <div class="text-sm">
                  <p class="font-medium text-gray-900">{{ vehicle.owner_name }}</p>
                </div>
              </td>

              <!-- Unit Number -->
              <td class="px-6 py-4 whitespace-nowrap">
                <span class="text-sm text-gray-700">{{ vehicle.unit_number }}</span>
              </td>

              <!-- Phone -->
              <td class="px-6 py-4 whitespace-nowrap">
                <span class="text-sm text-gray-700">{{ vehicle.phone }}</span>
              </td>

              <!-- Status -->
              <td class="px-6 py-4 whitespace-nowrap">
                <span 
                  :class="[
                    'inline-flex px-3 py-1 rounded-full text-xs font-semibold',
                    vehicle.status === 'active' 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-red-100 text-red-800'
                  ]"
                >
                  {{ vehicle.status.toUpperCase() }}
                </span>
              </td>

              <!-- Added Date -->
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {{ formatDate(vehicle.created_at) }}
              </td>

              <!-- Actions -->
              <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-3">
                <button
                  v-if="userRole === 'admin'"
                  @click="editVehicle(vehicle)"
                  class="text-primary-blue hover:text-blue-700 font-semibold"
                >
                  Edit
                </button>
                <button
                  v-if="userRole === 'admin'"
                  @click="toggleStatus(vehicle)"
                  :class="[
                    'font-semibold',
                    vehicle.status === 'active' 
                      ? 'text-yellow-600 hover:text-yellow-800'
                      : 'text-green-600 hover:text-green-800'
                  ]"
                >
                  {{ vehicle.status === 'active' ? 'Deactivate' : 'Activate' }}
                </button>
                <button
                  v-if="userRole === 'admin'"
                  @click="deleteVehicle(vehicle.id)"
                  class="text-red-600 hover:text-red-800 font-semibold"
                >
                  Delete
                </button>
                <span v-if="userRole === 'security'" class="text-gray-400 text-sm">View Only</span>
              </td>
            </tr>

            <!-- Empty State -->
            <tr v-if="paginatedVehicles.length === 0">
              <td colspan="7" class="px-6 py-12 text-center">
                <TruckIcon class="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p class="text-gray-500 text-lg font-medium">No vehicles found</p>
                <p class="text-gray-400 text-sm mt-2">Add your first vehicle to get started</p>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Pagination -->
      <div v-if="totalPages > 1" class="bg-gray-50 px-6 py-4 border-t">
        <div class="flex items-center justify-between">
          <div class="text-sm text-gray-700">
            Showing <span class="font-semibold">{{ startIndex + 1 }}</span> to 
            <span class="font-semibold">{{ endIndex }}</span> of 
            <span class="font-semibold">{{ filteredVehicles.length }}</span> results
          </div>

          <div class="flex items-center space-x-2">
            <button
              @click="currentPage--"
              :disabled="currentPage === 1"
              :class="[
                'px-3 py-1 rounded border',
                currentPage === 1 
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              ]"
            >
              Previous
            </button>

            <button
              v-for="page in displayedPages"
              :key="page"
              @click="currentPage = page"
              :class="[
                'px-3 py-1 rounded border',
                currentPage === page 
                  ? 'bg-primary-blue text-white' 
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              ]"
            >
              {{ page }}
            </button>

            <button
              @click="currentPage++"
              :disabled="currentPage === totalPages"
              :class="[
                'px-3 py-1 rounded border',
                currentPage === totalPages 
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              ]"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Add/Edit Vehicle Modal -->
    <div
      v-if="showAddModal"
      class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      @click.self="closeModal"
    >
      <div class="bg-white rounded-xl p-8 max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div class="flex items-center justify-between mb-6">
          <h3 class="text-2xl font-bold text-gray-800">
            {{ editMode ? 'Edit Vehicle' : 'Add New Vehicle' }}
          </h3>
          <button @click="closeModal" class="text-gray-400 hover:text-gray-600">
            <XMarkIcon class="w-6 h-6" />
          </button>
        </div>
        
        <form @submit.prevent="handleSubmit" class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">
              Plate Number <span class="text-red-500">*</span>
            </label>
            <input
              v-model="formData.plate_number"
              type="text"
              required
              :disabled="editMode"
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-blue focus:border-transparent uppercase"
              placeholder="B1234XYZ"
            />
            <p class="text-xs text-gray-500 mt-1">Format: B1234XYZ (Indonesia)</p>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">
              Owner Name <span class="text-red-500">*</span>
            </label>
            <input
              v-model="formData.owner_name"
              type="text"
              required
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-blue focus:border-transparent"
              placeholder="John Doe"
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">
              Email <span class="text-red-500">*</span>
            </label>
            <input
              v-model="formData.email"
              type="email"
              required
              :disabled="editMode"
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-blue focus:border-transparent"
              placeholder="john@example.com"
            />
            <p class="text-xs text-gray-500 mt-1">Email will be used for login</p>
          </div>

          <div v-if="!editMode">
            <label class="block text-sm font-medium text-gray-700 mb-1">
              Password <span class="text-red-500">*</span>
            </label>
            <input
              v-model="formData.password"
              type="password"
              required
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-blue focus:border-transparent"
              placeholder="Minimum 6 characters"
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">
              Unit Number <span class="text-red-500">*</span>
            </label>
            <input
              v-model="formData.unit_number"
              type="text"
              required
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-blue focus:border-transparent"
              placeholder="A-205"
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">
              Phone Number <span class="text-red-500">*</span>
            </label>
            <input
              v-model="formData.phone"
              type="tel"
              required
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-blue focus:border-transparent"
              placeholder="+62812345678"
            />
          </div>

          <div class="flex space-x-3 pt-4">
            <button
              type="button"
              @click="closeModal"
              class="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-800 font-semibold py-3 px-4 rounded-lg transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              class="flex-1 bg-primary-blue hover:bg-blue-600 text-white font-semibold py-3 px-4 rounded-lg transition"
            >
              {{ editMode ? 'Update' : 'Add' }} Vehicle
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useAppStore } from '@/stores/app'
import {
  PlusIcon,
  MagnifyingGlassIcon,
  TruckIcon,
  CheckCircleIcon,
  XCircleIcon,
  ArrowDownTrayIcon,
  ChevronUpDownIcon,
  XMarkIcon
} from '@heroicons/vue/24/outline'

const props = defineProps({
  vehicles: {
    type: Array,
    default: () => []
  }
})

const emit = defineEmits(['refresh'])

const appStore = useAppStore()

// State
const showAddModal = ref(false)
const editMode = ref(false)
const selectedVehicle = ref(null)
const searchQuery = ref('')
const statusFilter = ref('all')
const currentPage = ref(1)
const itemsPerPage = ref(10)
const sortField = ref('created_at')
const sortDirection = ref('desc')

const formData = ref({
  plate_number: '',
  owner_name: '',
  email: '',
  password: '',
  unit_number: '',
  phone: ''
})

// Get current user role
const userRole = computed(() => {
  const user = JSON.parse(localStorage.getItem('user') || '{}')
  return user.role || 'security'
})

// Computed
const activeCount = computed(() => 
  props.vehicles.filter(v => v.status === 'active').length
)

const inactiveCount = computed(() => 
  props.vehicles.filter(v => v.status === 'inactive').length
)

const filteredVehicles = computed(() => {
  let result = [...props.vehicles]

  // Filter by search
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    result = result.filter(v =>
      v.plate_number.toLowerCase().includes(query) ||
      v.owner_name.toLowerCase().includes(query) ||
      v.unit_number.toLowerCase().includes(query) ||
      v.phone.includes(query)
    )
  }

  // Filter by status
  if (statusFilter.value !== 'all') {
    result = result.filter(v => v.status === statusFilter.value)
  }

  // Sort
  result.sort((a, b) => {
    const aVal = a[sortField.value]
    const bVal = b[sortField.value]
    
    if (sortDirection.value === 'asc') {
      return aVal > bVal ? 1 : -1
    } else {
      return aVal < bVal ? 1 : -1
    }
  })

  return result
})

const totalPages = computed(() => 
  Math.ceil(filteredVehicles.value.length / itemsPerPage.value)
)

const startIndex = computed(() => 
  (currentPage.value - 1) * itemsPerPage.value
)

const endIndex = computed(() => 
  Math.min(startIndex.value + itemsPerPage.value, filteredVehicles.value.length)
)

const paginatedVehicles = computed(() => 
  filteredVehicles.value.slice(startIndex.value, endIndex.value)
)

const displayedPages = computed(() => {
  const pages = []
  const maxPages = 5
  let start = Math.max(1, currentPage.value - Math.floor(maxPages / 2))
  let end = Math.min(totalPages.value, start + maxPages - 1)
  
  if (end - start < maxPages - 1) {
    start = Math.max(1, end - maxPages + 1)
  }
  
  for (let i = start; i <= end; i++) {
    pages.push(i)
  }
  
  return pages
})

// Methods
const handleSubmit = async () => {
  try {
    if (editMode.value) {
      await appStore.updateVehicle(selectedVehicle.value.id, formData.value)
    } else {
      await appStore.addVehicle(formData.value)
    }
    
    emit('refresh')
    closeModal()
  } catch (error) {
    console.error('Error saving vehicle:', error)
    alert('Failed to save vehicle')
  }
}

const editVehicle = (vehicle) => {
  editMode.value = true
  selectedVehicle.value = vehicle
  formData.value = { ...vehicle }
  showAddModal.value = true
}

const deleteVehicle = async (id) => {
  if (!confirm('Are you sure you want to delete this vehicle?')) return
  
  try {
    await appStore.deleteVehicle(id)
    emit('refresh')
  } catch (error) {
    console.error('Error deleting vehicle:', error)
    alert('Failed to delete vehicle')
  }
}

const toggleStatus = async (vehicle) => {
  const newStatus = vehicle.status === 'active' ? 'inactive' : 'active'
  
  try {
    await appStore.updateVehicle(vehicle.id, { status: newStatus })
    emit('refresh')
  } catch (error) {
    console.error('Error updating status:', error)
    alert('Failed to update status')
  }
}

const closeModal = () => {
  showAddModal.value = false
  editMode.value = false
  selectedVehicle.value = null
  formData.value = {
    plate_number: '',
    owner_name: '',
    unit_number: '',
    phone: ''
  }
}

const sortBy = (field) => {
  if (sortField.value === field) {
    sortDirection.value = sortDirection.value === 'asc' ? 'desc' : 'asc'
  } else {
    sortField.value = field
    sortDirection.value = 'asc'
  }
}

const exportData = () => {
  // Convert to CSV
  const headers = ['Plate Number', 'Owner Name', 'Unit Number', 'Phone', 'Status', 'Created At']
  const rows = filteredVehicles.value.map(v => [
    v.plate_number,
    v.owner_name,
    v.unit_number,
    v.phone,
    v.status,
    formatDate(v.created_at)
  ])
  
  const csv = [
    headers.join(','),
    ...rows.map(row => row.join(','))
  ].join('\n')
  
  // Download
  const blob = new Blob([csv], { type: 'text/csv' })
  const url = window.URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `vehicles-${new Date().toISOString().split('T')[0]}.csv`
  a.click()
  window.URL.revokeObjectURL(url)
}

const formatDate = (dateString) => {
  if (!dateString) return '-'
  const date = new Date(dateString)
  return date.toLocaleDateString('id-ID', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}

// Watch for search/filter changes and reset page
watch([searchQuery, statusFilter], () => {
  currentPage.value = 1
})
</script>