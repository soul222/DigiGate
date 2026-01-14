<template>
  <nav class="fixed top-0 left-0 right-0 bg-white shadow-md z-40">
    <div class="px-4 md:px-6 py-3 md:py-4">
      <div class="flex items-center justify-between">
        <!-- Mobile Menu Button -->
        <button
          @click="appStore.toggleMobileMenu()"
          class="md:hidden p-2 rounded-lg hover:bg-gray-100 transition"
        >
          <svg class="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>

        <!-- Logo -->
        <div class="flex items-center space-x-2 md:space-x-3">
          <div class="w-8 h-8 md:w-10 md:h-10 bg-primary-blue rounded-lg flex items-center justify-center">
            <svg class="w-5 h-5 md:w-6 md:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
          </div>
          <div class="hidden sm:block">
            <h1 class="text-lg md:text-xl font-bold text-gray-800">DigiGate</h1>
            <p class="text-[10px] md:text-xs text-gray-500 leading-none">Smart Security</p>
          </div>
        </div>
        
        <!-- Right Side -->
        <div class="flex items-center space-x-3 md:space-x-6">
          <!-- Gate Status -->
          <div class="hidden sm:flex items-center space-x-2">
            <div :class="[
              'w-2 h-2 md:w-3 md:h-3 rounded-full',
              appStore.gateStatus === 'open' ? 'bg-green-500 animate-pulse' : 'bg-gray-400'
            ]"></div>
            <span class="text-xs md:text-sm font-medium text-gray-700">
              <span class="hidden md:inline">Gate:</span> {{ appStore.gateStatus.toUpperCase() }}
            </span>
          </div>
          
          <!-- Notifications -->
          <button class="relative p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition">
            <svg class="w-5 h-5 md:w-6 md:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
            <span class="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
          </button>
          
          <!-- User Profile -->
          <div class="flex items-center space-x-2 md:space-x-3">
            <div class="hidden md:block text-right">
              <p class="text-xs md:text-sm font-semibold text-gray-700">{{ user.full_name || 'User' }}</p>
              <p class="text-[10px] md:text-xs text-gray-500">{{ user.role || 'Guest' }}</p>
            </div>
            <button 
              @click="showProfileMenu = !showProfileMenu"
              class="relative w-8 h-8 md:w-10 md:h-10 bg-primary-blue rounded-full flex items-center justify-center hover:bg-blue-600 transition"
            >
              <span class="text-white text-sm md:text-base font-semibold">{{ userInitial }}</span>
            </button>

            <!-- Profile Dropdown -->
            <div 
              v-if="showProfileMenu"
              class="absolute right-4 top-16 md:top-20 w-48 bg-white rounded-lg shadow-xl border py-2 z-50"
            >
              <router-link
                to="/settings"
                @click="showProfileMenu = false"
                class="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition"
              >
                ⚙️ Settings
              </router-link>
              <button
                @click="handleLogout"
                class="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition"
              >
                🚪 Logout
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Mobile Gate Status -->
      <div class="sm:hidden mt-3 flex items-center justify-center space-x-2 pb-1">
        <div :class="[
          'w-2 h-2 rounded-full',
          appStore.gateStatus === 'open' ? 'bg-green-500 animate-pulse' : 'bg-gray-400'
        ]"></div>
        <span class="text-xs font-medium text-gray-700">
          Gate: {{ appStore.gateStatus.toUpperCase() }}
        </span>
      </div>
    </div>
  </nav>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAppStore } from '@/stores/app'

const appStore = useAppStore()
const router = useRouter()

const showProfileMenu = ref(false)
const user = ref(JSON.parse(localStorage.getItem('user') || '{}'))

const userInitial = computed(() => {
  return user.value.full_name?.charAt(0).toUpperCase() || 'U'
})

const handleLogout = () => {
  localStorage.removeItem('token')
  localStorage.removeItem('user')
  router.push('/login')
}

// Close profile menu when clicking outside
const handleClickOutside = (event) => {
  if (!event.target.closest('.relative')) {
    showProfileMenu.value = false
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})
</script>

<style scoped>
/* Prevent body scroll when profile menu is open on mobile */
@media (max-width: 768px) {
  .z-50 {
    position: fixed;
  }
}
</style>