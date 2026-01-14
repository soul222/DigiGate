<template>
  <div class="min-h-screen bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center p-4">
    <div class="w-full max-w-md">
      <!-- Logo Card -->
      <div class="bg-white rounded-t-3xl p-6 md:p-8 text-center shadow-2xl">
        <div class="w-16 h-16 md:w-20 md:h-20 bg-blue-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <svg class="w-10 h-10 md:w-12 md:h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
          </svg>
        </div>
        <h1 class="text-2xl md:text-3xl font-bold text-gray-800 mb-2">OneGate</h1>
        <p class="text-gray-600 text-xs md:text-sm">Smart Security System</p>
      </div>

      <!-- Login Form -->
      <div class="bg-white rounded-b-3xl p-6 md:p-8 shadow-2xl">
        <h2 class="text-xl md:text-2xl font-bold text-gray-800 mb-6 text-center">
          Sign In
        </h2>

        <!-- Error Alert -->
        <div v-if="error" class="mb-4 p-3 md:p-4 bg-red-50 border border-red-200 rounded-lg flex items-start">
          <svg class="w-5 h-5 text-red-500 mr-2 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
          </svg>
          <span class="text-red-700 text-sm">{{ error }}</span>
        </div>

        <div @submit.prevent="handleLogin" class="space-y-4 md:space-y-5">
          <!-- Email Input -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              Email Address
            </label>
            <div class="relative">
              <div class="absolute inset-y-0 left-0 pl-3 md:pl-4 flex items-center pointer-events-none">
                <svg class="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <input
                v-model="formData.email"
                type="email"
                class="w-full pl-10 md:pl-12 pr-4 py-2.5 md:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition text-sm md:text-base"
                placeholder="admin@onegate.com"
                required
              />
            </div>
          </div>

          <!-- Password Input -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              Password
            </label>
            <div class="relative">
              <div class="absolute inset-y-0 left-0 pl-3 md:pl-4 flex items-center pointer-events-none">
                <svg class="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <input
                v-model="formData.password"
                :type="showPassword ? 'text' : 'password'"
                class="w-full pl-10 md:pl-12 pr-12 py-2.5 md:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition text-sm md:text-base"
                placeholder="••••••••"
                required
              />
              <button
                type="button"
                @click="showPassword = !showPassword"
                class="absolute inset-y-0 right-0 pr-3 md:pr-4 flex items-center"
              >
                <svg v-if="showPassword" class="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                </svg>
                <svg v-else class="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              </button>
            </div>
          </div>

          <!-- Submit Button -->
          <button
            @click="handleLogin"
            :disabled="loading"
            class="w-full bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 text-white font-semibold py-2.5 md:py-3 px-4 rounded-lg transition duration-200 flex items-center justify-center shadow-lg text-sm md:text-base"
          >
            <template v-if="loading">
              <svg class="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Signing In...
            </template>
            <template v-else>
              <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
              </svg>
              Sign In
            </template>
          </button>
        </div>

        <!-- Demo Credentials -->
        <div class="mt-6 p-3 md:p-4 bg-blue-50 rounded-lg border border-blue-100">
          <p class="text-xs font-semibold text-blue-800 mb-2">Demo Credentials:</p>
          <div class="text-xs text-blue-700 space-y-1">
            <p><strong>Admin:</strong> admin@onegate.com / admin123</p>
            <p><strong>Security:</strong> security@onegate.com / security123</p>
          </div>
        </div>

        <!-- Footer -->
        <div class="mt-6 text-center">
          <p class="text-sm text-gray-600">
            Don't have an account?
            <router-link to="/register" class="text-blue-500 hover:text-blue-600 font-semibold">
              Sign Up
            </router-link>
          </p>
        </div>
      </div>

      <!-- Version Info -->
      <div class="text-center mt-6">
        <p class="text-white text-xs">
          OneGate v1.0.0 © 2025
        </p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import axios from 'axios'

const router = useRouter()

const formData = ref({
  email: '',
  password: ''
})

const loading = ref(false)
const error = ref('')
const showPassword = ref(false)

const handleLogin = async () => {
  error.value = ''
  loading.value = true

  try {
    const response = await axios.post(
      `${import.meta.env.VITE_API_URL}/auth/login`,
      formData.value
    )

    if (response.data.success) {
      // Store token and user data
      localStorage.setItem('token', response.data.token)
      localStorage.setItem('user', JSON.stringify(response.data.user))
      
      // Redirect to dashboard
      router.push('/')
    } else {
      error.value = response.data.error || 'Login failed'
    }
  } catch (err) {
    if (err.response?.data?.error) {
      error.value = err.response.data.error
    } else {
      error.value = 'Connection error. Please try again.'
    }
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
/* Mobile optimizations */
@media (max-width: 640px) {
  input {
    font-size: 16px; /* Prevent zoom on iOS */
  }
}
</style>