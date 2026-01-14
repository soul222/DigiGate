<template>
  <!-- Mobile Overlay -->
  <div 
    v-if="isMobileMenuOpen" 
    @click="closeMobileMenu"
    class="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
  ></div>

  <!-- Sidebar -->
  <aside 
    :class="[
      'fixed left-0 top-16 bottom-0 w-64 bg-white shadow-lg z-40 transition-transform duration-300',
      'md:translate-x-0',
      isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
    ]"
  >
    <nav class="p-4 space-y-2">
      <router-link
        v-for="route in navigation"
        :key="route.path"
        :to="route.path"
        @click="closeMobileMenu"
        class="flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors"
        :class="isActive(route.path) 
          ? 'bg-primary-blue text-white' 
          : 'text-gray-700 hover:bg-gray-100'"
      >
        <component :is="route.icon" class="w-5 h-5" />
        <span class="font-medium">{{ route.name }}</span>
      </router-link>
    </nav>
    
    <!-- Footer -->
    <div class="absolute bottom-0 left-0 right-0 p-4 border-t">
      <div class="text-center text-xs text-gray-500">
        <p>Version 1.0.0</p>
        <p class="mt-1">© 2025 DigiGate</p>
      </div>
    </div>
  </aside>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { useAppStore } from '@/stores/app'
import {
  HomeIcon,
  TruckIcon,
  ClipboardDocumentListIcon,
  UserGroupIcon,
  QrCodeIcon,
  CameraIcon,
  CogIcon
} from '@heroicons/vue/24/outline'

const route = useRoute()
const appStore = useAppStore()

const navigation = [
  { path: '/', name: 'Dashboard', icon: HomeIcon },
  { path: '/vehicles', name: 'Vehicles', icon: TruckIcon },
  { path: '/logs', name: 'Access Logs', icon: ClipboardDocumentListIcon },
  { path: '/visitors', name: 'Visitors', icon: UserGroupIcon },
  { path: '/qr-scanner', name: 'QR Scanner', icon: QrCodeIcon },
  { path: '/plate-detection', name: 'Plate Detection', icon: CameraIcon },
  { path: '/settings', name: 'Settings', icon: CogIcon },
]

const isMobileMenuOpen = computed(() => appStore.isMobileMenuOpen)

const isActive = (path) => {
  return route.path === path
}

const closeMobileMenu = () => {
  appStore.closeMobileMenu()
}
</script>
