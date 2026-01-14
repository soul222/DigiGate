import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import api from '@/services/api'

export const useAppStore = defineStore('app', () => {
  // State
  const statistics = ref({
    totalVehicles: 0,
    todayEntries: 0,
    todayRejected: 0
  })
  
  const gateStatus = ref('closed')
  const recentLogs = ref([])
  const vehicles = ref([])
  const loading = ref(false)
  const error = ref(null)
  const isMobileMenuOpen = ref(false)
  
  // Computed
  const hasVehicles = computed(() => vehicles.value.length > 0)
  const hasLogs = computed(() => recentLogs.value.length > 0)
  
  // Actions
  async function loadStatistics() {
    try {
      loading.value = true
      const response = await api.getStatistics()
      statistics.value = response.data.statistics
    } catch (err) {
      error.value = err.message
      console.error('Error loading statistics:', err)
    } finally {
      loading.value = false
    }
  }
  
  async function loadVehicles() {
    try {
      loading.value = true
      const response = await api.getVehicles()
      vehicles.value = response.data.data
    } catch (err) {
      error.value = err.message
      console.error('Error loading vehicles:', err)
    } finally {
      loading.value = false
    }
  }
  
  async function loadRecentLogs(limit = 10) {
    try {
      loading.value = true
      const response = await api.getAccessLogs({ limit })
      recentLogs.value = response.data.data
    } catch (err) {
      error.value = err.message
      console.error('Error loading logs:', err)
    } finally {
      loading.value = false
    }
  }
  
  async function addVehicle(vehicleData) {
    try {
      loading.value = true
      const response = await api.addVehicle(vehicleData)
      vehicles.value.unshift(response.data.data)
      await loadStatistics()
      return response.data
    } catch (err) {
      error.value = err.message
      throw err
    } finally {
      loading.value = false
    }
  }
  
  async function deleteVehicle(id) {
    try {
      loading.value = true
      await api.deleteVehicle(id)
      vehicles.value = vehicles.value.filter(v => v.id !== id)
      await loadStatistics()
    } catch (err) {
      error.value = err.message
      throw err
    } finally {
      loading.value = false
    }
  }

  async function addVehicle(data) {
    try {
      loading.value = true
      const response = await api.addVehicle(data)
      vehicles.value.unshift(response.data.data)
      await loadStatistics()
      return response
    } catch (err) {
      error.value = err.message
      throw err
    } finally {
      loading.value = false
    }
  }

  async function updateVehicle(id, data) {
    try {
      loading.value = true
      await api.updateVehicle(id, data)
      const index = vehicles.value.findIndex(v => v.id === id)
      if (index !== -1) {
        vehicles.value[index] = { ...vehicles.value[index], ...data }
      }
      await loadStatistics()
    } catch (err) {
      error.value = err.message
      throw err
    } finally {
      loading.value = false
    }
  }
  
  async function controlGate(action) {
    try {
      if (action === 'open') {
        await api.openGate({ triggered_by: 'Admin', reason: 'Manual control' })
        gateStatus.value = 'open'
        setTimeout(() => {
          gateStatus.value = 'closed'
        }, 5000)
      } else {
        await api.closeGate({ triggered_by: 'Admin', reason: 'Manual control' })
        gateStatus.value = 'closed'
      }
    } catch (err) {
      error.value = err.message
      throw err
    }
  }
  
  function updateGateStatus(status) {
    gateStatus.value = status
  }
  
  function addNewLog(log) {
    recentLogs.value.unshift(log)
    if (recentLogs.value.length > 50) {
      recentLogs.value.pop()
    }
    loadStatistics()
  }
  
  function toggleMobileMenu() {
    isMobileMenuOpen.value = !isMobileMenuOpen.value
  }
  
  function closeMobileMenu() {
    isMobileMenuOpen.value = false
  }
  
  function openMobileMenu() {
    isMobileMenuOpen.value = true
  }
  
  return {
    // State
    statistics,
    gateStatus,
    recentLogs,
    vehicles,
    loading,
    error,
    isMobileMenuOpen,
    // Computed
    hasVehicles,
    hasLogs,
    // Actions
    loadStatistics,
    loadVehicles,
    loadRecentLogs,
    addVehicle,
    deleteVehicle,
    controlGate,
    updateGateStatus,
    addNewLog,
    toggleMobileMenu,
    closeMobileMenu,
    openMobileMenu
  }
})
