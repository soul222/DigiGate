import { createRouter, createWebHistory } from 'vue-router'
import Login from '@/views/Login.vue'
import Register from '@/views/Register.vue'
import Home from '@/views/Home.vue'
import Vehicles from '@/views/Vehicles.vue'
import Logs from '@/views/Logs.vue'
import Visitors from '@/views/Visitors.vue'
import Settings from '@/views/Settings.vue'
import QRScanner from '@/views/QRScanner.vue'
import PlateDetection from '@/views/PlateDetection.vue'

const routes = [
  // Auth Routes (No layout)
  {
    path: '/login',
    name: 'Login',
    component: Login,
    meta: { 
      requiresAuth: false,
      title: 'Login - OneGate'
    }
  },
  {
    path: '/register',
    name: 'Register',
    component: Register,
    meta: { 
      requiresAuth: false,
      title: 'Register - OneGate'
    }
  },
  
  // Protected Routes (With layout)
  {
    path: '/',
    name: 'Home',
    component: Home,
    meta: {
      requiresAuth: true,
      title: 'Dashboard - OneGate',
      icon: 'HomeIcon'
    }
  },
  {
    path: '/vehicles',
    name: 'Vehicles',
    component: Vehicles,
    meta: {
      requiresAuth: true,
      title: 'Vehicles Management - OneGate',
      icon: 'TruckIcon',
      roles: ['admin', 'security'] // Only admin and security can access
    }
  },
  {
    path: '/logs',
    name: 'Logs',
    component: Logs,
    meta: {
      requiresAuth: true,
      title: 'Access Logs - OneGate',
      icon: 'ClipboardDocumentListIcon'
    }
  },
  {
    path: '/visitors',
    name: 'Visitors',
    component: Visitors,
    meta: {
      requiresAuth: true,
      title: 'Visitor Management - OneGate',
      icon: 'UserGroupIcon',
      roles: ['admin', 'resident'] // Only admin and residents can invite
    }
  },
  {
    path: '/qr-scanner',
    name: 'QRScanner',
    component: QRScanner,
    meta: {
      requiresAuth: true,
      title: 'QR Scanner - OneGate',
      icon: 'QrCodeIcon',
      roles: ['admin', 'security'] // Security can scan QR codes
    }
  },
  {
    path: '/plate-detection',
    name: 'PlateDetection',
    component: PlateDetection,
    meta: {
      requiresAuth: true,
      title: 'Plate Detection - OneGate',
      icon: 'CameraIcon',
      roles: ['admin', 'security']
    }
  },
  {
    path: '/settings',
    name: 'Settings',
    component: Settings,
    meta: {
      requiresAuth: true,
      title: 'Settings - OneGate',
      icon: 'CogIcon'
    }
  },
  
  // Catch all - redirect to home
  {
    path: '/:pathMatch(.*)*',
    redirect: '/'
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

// Navigation guard for authentication
router.beforeEach((to, from, next) => {
  const token = localStorage.getItem('token')
  const user = JSON.parse(localStorage.getItem('user') || '{}')
  
  // Set document title
  document.title = to.meta.title || 'OneGate - Smart Security System'
  
  // Check if route requires authentication
  if (to.meta.requiresAuth) {
    if (!token) {
      // Not logged in, redirect to login
      next({
        path: '/login',
        query: { redirect: to.fullPath } // Save intended destination
      })
      return
    }
    
    // Check role-based access
    if (to.meta.roles && !to.meta.roles.includes(user.role)) {
      // User doesn't have required role
      alert('You do not have permission to access this page')
      next('/')
      return
    }
  } else {
    // Route doesn't require auth
    if (token && (to.path === '/login' || to.path === '/register')) {
      // Already logged in, redirect to home
      next('/')
      return
    }
  }
  
  next()
})

export default router