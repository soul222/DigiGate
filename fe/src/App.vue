<template>
  <div id="app" class="min-h-screen bg-gray-50">
    <template v-if="$route.meta.requiresAuth">
      <Navbar />
      
      <div class="flex">
        <Sidebar />
        
        <main class="flex-1 p-4 md:p-6 md:ml-64 mt-16">
          <router-view v-slot="{ Component }">
            <transition name="fade" mode="out-in">
              <component :is="Component" />
            </transition>
          </router-view>
        </main>
      </div>
    </template>
    
    <template v-else>
      <router-view v-slot="{ Component }">
        <transition name="fade" mode="out-in">
          <component :is="Component" />
        </transition>
      </router-view>
    </template>
    
    <div v-if="appStore.loading" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div class="bg-white rounded-lg p-6">
        <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-blue mx-auto"></div>
        <p class="mt-4 text-gray-700">Loading...</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { onMounted, onUnmounted } from 'vue'
import { useAppStore } from '@/stores/app'
import { io } from 'socket.io-client'
import Navbar from '@/components/layout/Navbar.vue'
import Sidebar from '@/components/layout/Sidebar.vue'

const appStore = useAppStore()

// --- SETUP SOCKET CONNECTION ---
// Pastikan URL benar, fallback ke localhost:3000 jika env tidak terbaca
const socketUrl = import.meta.env.VITE_SOCKET_URL || 'http://localhost:3000';

console.log(`🔌 Initializing Socket to: ${socketUrl}`);

const socket = io(socketUrl, {
  withCredentials: true, // Wajib true (harus sama dengan backend)
  transports: ['websocket', 'polling'],
  autoConnect: true,
  reconnection: true,
  reconnectionAttempts: 5
})

onMounted(() => {
  // Load data awal jika user sudah login
  const token = localStorage.getItem('token')
  if (token) {
    appStore.loadStatistics()
    appStore.loadVehicles()
    appStore.loadRecentLogs()
  }
  
  // --- SOCKET LISTENERS ---
  socket.on('connect', () => {
    console.log('✅ Socket connected successfully:', socket.id)
  })
  
  socket.on('connect_error', (error) => {
    console.error('❌ Socket connection error:', error.message)
    // Tips: Jika error CORS, biasanya pesannya "xhr poll error"
  })
  
  socket.on('new-access', (data) => {
    console.log('🔔 New Access Log:', data)
    appStore.addNewLog(data)
  })
  
  socket.on('gate-status', (status) => {
    console.log('🚧 Gate Status Update:', status)
    appStore.updateGateStatus(status)
  })
  
  socket.on('disconnect', (reason) => {
    console.warn('⚠️ Socket disconnected:', reason)
  })
})

// Cleanup saat komponen dihancurkan (best practice)
onUnmounted(() => {
  if (socket) {
    socket.off(); // matikan semua listener
    socket.disconnect();
  }
})
</script>

<style>
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: 'Inter', sans-serif;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>