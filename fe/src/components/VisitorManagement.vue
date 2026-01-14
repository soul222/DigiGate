<template>
  <div class="space-y-6">
    <!-- Header Actions -->
    <div class="flex items-center justify-between">
      <div>
        <h2 class="text-2xl font-bold text-gray-800">Visitor Access</h2>
        <p class="text-sm text-gray-600 mt-1">Manage temporary visitor access with QR codes</p>
      </div>
      <button
        @click="showAddModal = true"
        class="bg-primary-blue hover:bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold transition flex items-center space-x-2"
      >
        <UserPlusIcon class="w-5 h-5" />
        <span>Invite Visitor</span>
      </button>
    </div>

    <!-- Statistics Cards -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div class="bg-white rounded-xl shadow-md p-6">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm text-gray-600">Active Visitors</p>
            <p class="text-3xl font-bold text-gray-800 mt-2">{{ activeVisitors }}</p>
          </div>
          <div class="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
            <CheckCircleIcon class="w-6 h-6 text-green-600" />
          </div>
        </div>
      </div>

      <div class="bg-white rounded-xl shadow-md p-6">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm text-gray-600">Pending</p>
            <p class="text-3xl font-bold text-gray-800 mt-2">{{ pendingVisitors }}</p>
          </div>
          <div class="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
            <ClockIcon class="w-6 h-6 text-yellow-600" />
          </div>
        </div>
      </div>

      <div class="bg-white rounded-xl shadow-md p-6">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm text-gray-600">Expired</p>
            <p class="text-3xl font-bold text-gray-800 mt-2">{{ expiredVisitors }}</p>
          </div>
          <div class="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
            <XCircleIcon class="w-6 h-6 text-red-600" />
          </div>
        </div>
      </div>
    </div>

    <!-- Visitors Table -->
    <div class="bg-white rounded-xl shadow-md overflow-hidden">
      <div class="p-6 border-b">
        <div class="flex items-center justify-between">
          <h3 class="text-xl font-bold text-gray-800">Visitor List</h3>
          
          <!-- Search & Filter -->
          <div class="flex items-center space-x-3">
            <div class="relative">
              <input
                v-model="searchQuery"
                type="text"
                placeholder="Search visitors..."
                class="pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-blue focus:border-transparent"
              />
              <MagnifyingGlassIcon class="w-5 h-5 text-gray-400 absolute left-3 top-2.5" />
            </div>
            
            <select 
              v-model="statusFilter"
              class="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-blue"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="pending">Pending</option>
              <option value="expired">Expired</option>
            </select>
          </div>
        </div>
      </div>

      <div class="overflow-x-auto">
        <table class="min-w-full divide-y divide-gray-200">
          <thead class="bg-gray-50">
            <tr>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Visitor Info
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Host
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Valid Until
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody class="bg-white divide-y divide-gray-200">
            <tr v-for="visitor in filteredVisitors" :key="visitor.id" class="hover:bg-gray-50">
              <td class="px-6 py-4">
                <div class="flex items-center">
                  <div class="w-10 h-10 bg-primary-blue rounded-full flex items-center justify-center">
                    <span class="text-white font-semibold">{{ visitor.visitor_name.charAt(0) }}</span>
                  </div>
                  <div class="ml-3">
                    <p class="font-semibold text-gray-900">{{ visitor.visitor_name }}</p>
                    <p class="text-sm text-gray-500">{{ visitor.phone }}</p>
                    <p class="text-xs text-gray-400" v-if="visitor.plate_number">
                      🚗 {{ visitor.plate_number }}
                    </p>
                  </div>
                </div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <p class="text-sm font-medium text-gray-900">Unit {{ visitor.host_unit }}</p>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <p class="text-sm text-gray-900">{{ formatDate(visitor.valid_until) }}</p>
                <p class="text-xs text-gray-500">{{ getTimeRemaining(visitor.valid_until) }}</p>
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <span :class="getStatusClass(visitor.status)" class="px-3 py-1 rounded-full text-xs font-semibold">
                  {{ visitor.status.toUpperCase() }}
                </span>
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm space-x-3">
                <button
                  @click="showQRCode(visitor)"
                  class="text-primary-blue hover:text-blue-700 font-semibold"
                >
                  QR Code
                </button>
                <button
                  @click="editVisitor(visitor)"
                  class="text-green-600 hover:text-green-800 font-semibold"
                >
                  Edit
                </button>
                <button
                  @click="deleteVisitor(visitor.id)"
                  class="text-red-600 hover:text-red-800 font-semibold"
                >
                  Delete
                </button>
              </td>
            </tr>
            
            <tr v-if="filteredVisitors.length === 0">
              <td colspan="5" class="px-6 py-8 text-center text-gray-500">
                No visitors found
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Add/Edit Visitor Modal -->
    <div
      v-if="showAddModal"
      class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      @click.self="closeModal"
    >
      <div class="bg-white rounded-xl p-8 max-w-lg w-full max-h-[90vh] overflow-y-auto">
        <div class="flex items-center justify-between mb-6">
          <h3 class="text-2xl font-bold text-gray-800">
            {{ editMode ? 'Edit Visitor' : 'Invite New Visitor' }}
          </h3>
          <button @click="closeModal" class="text-gray-400 hover:text-gray-600">
            <XMarkIcon class="w-6 h-6" />
          </button>
        </div>
        
        <form @submit.prevent="handleSubmit" class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Visitor Name *</label>
            <input
              v-model="formData.visitor_name"
              type="text"
              required
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-blue focus:border-transparent"
              placeholder="John Doe"
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Phone Number *</label>
            <input
              v-model="formData.phone"
              type="tel"
              required
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-blue focus:border-transparent"
              placeholder="+62812345678"
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Host Unit *</label>
            <input
              v-model="formData.host_unit"
              type="text"
              required
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-blue focus:border-transparent"
              placeholder="A-205"
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Plate Number (Optional)</label>
            <input
              v-model="formData.plate_number"
              type="text"
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-blue focus:border-transparent"
              placeholder="B1234XYZ"
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Valid Until *</label>
            <input
              v-model="formData.valid_until"
              type="datetime-local"
              required
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-blue focus:border-transparent"
            />
          </div>

          <div class="flex space-x-3 pt-4">
            <button
              type="button"
              @click="closeModal"
              class="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-800 font-semibold py-2 px-4 rounded-lg transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              class="flex-1 bg-primary-blue hover:bg-blue-600 text-white font-semibold py-2 px-4 rounded-lg transition"
            >
              {{ editMode ? 'Update' : 'Create' }} Visitor
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- QR Code Modal -->
    <div
      v-if="showQRModal"
      class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      @click.self="showQRModal = false"
    >
      <div class="bg-white rounded-xl p-8 max-w-md w-full">
        <div class="text-center">
          <h3 class="text-2xl font-bold text-gray-800 mb-4">Visitor QR Code</h3>
          <p class="text-gray-600 mb-6">{{ selectedVisitor?.visitor_name }}</p>
          
          <div class="bg-gray-100 p-6 rounded-lg mb-6 flex items-center justify-center">
            <canvas ref="qrCanvas" class="max-w-full"></canvas>
          </div>
          
          <div class="space-y-3">
            <button
              @click="downloadQRCode"
              class="w-full bg-primary-blue hover:bg-blue-600 text-white font-semibold py-3 px-4 rounded-lg transition"
            >
              Download QR Code
            </button>
            <button
              @click="shareQRCode"
              class="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-4 rounded-lg transition"
            >
              Share via WhatsApp
            </button>
            <button
              @click="showQRModal = false"
              class="w-full bg-gray-300 hover:bg-gray-400 text-gray-800 font-semibold py-3 px-4 rounded-lg transition"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, nextTick } from 'vue'
import QRCode from 'qrcode'
import api from '@/services/api'
import {
  UserPlusIcon,
  CheckCircleIcon,
  ClockIcon,
  XCircleIcon,
  MagnifyingGlassIcon,
  XMarkIcon
} from '@heroicons/vue/24/outline'

// State
const visitors = ref([])
const showAddModal = ref(false)
const showQRModal = ref(false)
const editMode = ref(false)
const selectedVisitor = ref(null)
const searchQuery = ref('')
const statusFilter = ref('all')
const qrCanvas = ref(null)

const formData = ref({
  visitor_name: '',
  phone: '',
  host_unit: '',
  plate_number: '',
  valid_until: ''
})

// Computed
const activeVisitors = computed(() => 
  visitors.value.filter(v => v.status === 'active').length
)

const pendingVisitors = computed(() => 
  visitors.value.filter(v => v.status === 'pending').length
)

const expiredVisitors = computed(() => 
  visitors.value.filter(v => v.status === 'expired').length
)

const filteredVisitors = computed(() => {
  let result = visitors.value

  // Filter by search
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    result = result.filter(v =>
      v.visitor_name.toLowerCase().includes(query) ||
      v.phone.includes(query) ||
      v.host_unit.toLowerCase().includes(query)
    )
  }

  // Filter by status
  if (statusFilter.value !== 'all') {
    result = result.filter(v => v.status === statusFilter.value)
  }

  return result
})

// Methods
const loadVisitors = async () => {
  try {
    const response = await api.getVisitors()
    visitors.value = response.data.data || []
  } catch (error) {
    console.error('Error loading visitors:', error)
  }
}

const handleSubmit = async () => {
  try {
    if (editMode.value) {
      await api.updateVisitor(selectedVisitor.value.id, formData.value)
    } else {
      const response = await api.addVisitor(formData.value)
      // Generate QR code for new visitor
      if (response.data.data) {
        selectedVisitor.value = response.data.data
        showQRModal.value = true
      }
    }
    
    await loadVisitors()
    closeModal()
  } catch (error) {
    console.error('Error saving visitor:', error)
    alert('Failed to save visitor')
  }
}

const editVisitor = (visitor) => {
  editMode.value = true
  selectedVisitor.value = visitor
  formData.value = { ...visitor }
  showAddModal.value = true
}

const deleteVisitor = async (id) => {
  if (!confirm('Are you sure you want to delete this visitor?')) return
  
  try {
    await api.deleteVisitor(id)
    await loadVisitors()
  } catch (error) {
    console.error('Error deleting visitor:', error)
    alert('Failed to delete visitor')
  }
}

const showQRCode = async (visitor) => {
  if (!visitor || !visitor.qr_code) {
    console.error('Invalid visitor data:', visitor)
    alert('Cannot generate QR code: Invalid visitor data')
    return
  }
  
  selectedVisitor.value = visitor
  showQRModal.value = true
  
  await nextTick()
  
  if (!qrCanvas.value) {
    console.error('QR Canvas element not found')
    return
  }
  
  // Generate QR code with visitor data
  const qrData = JSON.stringify({
    id: visitor.id,
    name: visitor.visitor_name,
    qr_code: visitor.qr_code,
    valid_until: visitor.valid_until
  })
  
  try {
    await QRCode.toCanvas(qrCanvas.value, qrData, {
      width: 300,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      }
    })
    console.log('QR Code generated successfully')
  } catch (error) {
    console.error('Error generating QR code:', error)
    alert('Failed to generate QR code')
  }
}

const downloadQRCode = () => {
  if (!qrCanvas.value || !selectedVisitor.value) {
    alert('QR Code not available')
    return
  }
  
  try {
    const url = qrCanvas.value.toDataURL('image/png')
    const link = document.createElement('a')
    link.download = `visitor-qr-${selectedVisitor.value.visitor_name}.png`
    link.href = url
    link.click()
  } catch (error) {
    console.error('Error downloading QR code:', error)
    alert('Failed to download QR code')
  }
}

const shareQRCode = () => {
  const message = `Hi! Here's your visitor access QR code for ${selectedVisitor.value.host_unit}. Valid until ${formatDate(selectedVisitor.value.valid_until)}.`
  const whatsappUrl = `https://wa.me/${selectedVisitor.value.phone.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`
  window.open(whatsappUrl, '_blank')
}

const closeModal = () => {
  showAddModal.value = false
  editMode.value = false
  selectedVisitor.value = null
  formData.value = {
    visitor_name: '',
    phone: '',
    host_unit: '',
    plate_number: '',
    valid_until: ''
  }
}

const getStatusClass = (status) => {
  const classes = {
    active: 'bg-green-100 text-green-800',
    pending: 'bg-yellow-100 text-yellow-800',
    expired: 'bg-red-100 text-red-800'
  }
  return classes[status] || 'bg-gray-100 text-gray-800'
}

const formatDate = (dateString) => {
  if (!dateString) return '-'
  const date = new Date(dateString)
  return date.toLocaleString('id-ID', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const getTimeRemaining = (validUntil) => {
  if (!validUntil) return '-'
  
  const now = new Date()
  const expiry = new Date(validUntil)
  const diff = expiry - now
  
  if (diff < 0) return 'Expired'
  
  const hours = Math.floor(diff / (1000 * 60 * 60))
  const days = Math.floor(hours / 24)
  
  if (days > 0) return `${days} day${days > 1 ? 's' : ''} left`
  if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} left`
  
  return 'Expiring soon'
}

// Lifecycle
onMounted(() => {
  loadVisitors()
})
</script>