<template>
  <div class="min-h-screen bg-gradient-to-br from-green-500 to-green-700 flex items-center justify-center p-4">
    <div class="w-full max-w-md">
      <!-- Logo Card -->
      <div class="bg-white rounded-t-3xl p-6 md:p-8 text-center shadow-2xl">
        <div class="w-16 h-16 md:w-20 md:h-20 bg-green-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <svg class="w-10 h-10 md:w-12 md:h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
          </svg>
        </div>
        <h1 class="text-2xl md:text-3xl font-bold text-gray-800 mb-2">Create Account</h1>
        <p class="text-gray-600 text-xs md:text-sm">Join OneGate Security System</p>
      </div>

      <!-- Register Form -->
      <div class="bg-white rounded-b-3xl p-6 md:p-8 shadow-2xl max-h-[70vh] overflow-y-auto">
        <!-- Success Message -->
        <div v-if="success" class="mb-4 p-3 md:p-4 bg-green-50 border border-green-200 rounded-lg">
          <p class="text-green-700 text-sm">✅ {{ success }}</p>
        </div>

        <!-- Error Alert -->
        <div v-if="error" class="mb-4 p-3 md:p-4 bg-red-50 border border-red-200 rounded-lg flex items-start">
          <svg class="w-5 h-5 text-red-500 mr-2 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
          </svg>
          <span class="text-red-700 text-sm">{{ error }}</span>
        </div>

        <div class="space-y-4">
          <!-- Full Name -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              Full Name <span class="text-red-500">*</span>
            </label>
            <input
              v-model="formData.full_name"
              type="text"
              class="w-full px-4 py-2.5 md:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition text-sm md:text-base"
              placeholder="John Doe"
              required
            />
          </div>

          <!-- Email -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              Email Address <span class="text-red-500">*</span>
            </label>
            <input
              v-model="formData.email"
              type="email"
              class="w-full px-4 py-2.5 md:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition text-sm md:text-base"
              placeholder="john@example.com"
              required
            />
          </div>

          <!-- Password -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              Password <span class="text-red-500">*</span>
            </label>
            <div class="relative">
              <input
                v-model="formData.password"
                :type="showPassword ? 'text' : 'password'"
                class="w-full px-4 pr-12 py-2.5 md:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition text-sm md:text-base"
                placeholder="Min. 6 characters"
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
            <p class="text-xs text-gray-500 mt-1">At least 6 characters</p>
          </div>

          <!-- Confirm Password -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              Confirm Password <span class="text-red-500">*</span>
            </label>
            <input
              v-model="confirmPassword"
              type="password"
              class="w-full px-4 py-2.5 md:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition text-sm md:text-base"
              placeholder="Repeat password"
              required
            />
          </div>

          <!-- Role Selection -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              Role <span class="text-red-500">*</span>
            </label>
            <select
              v-model="formData.role"
              class="w-full px-4 py-2.5 md:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition text-sm md:text-base"
              required
            >
              <option value="resident">Resident</option>
              <option value="security">Security Guard</option>
              <option value="admin">Administrator</option>
            </select>
          </div>

          <!-- Unit Number (for residents) -->
          <div v-if="formData.role === 'resident'">
            <label class="block text-sm font-medium text-gray-700 mb-2">
              Unit Number
            </label>
            <input
              v-model="formData.unit_number"
              type="text"
              class="w-full px-4 py-2.5 md:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition text-sm md:text-base"
              placeholder="A-101"
            />
          </div>

          <!-- Plate Number (for residents) -->
          <div v-if="formData.role === 'resident'">
            <label class="block text-sm font-medium text-gray-700 mb-2">
              Plate Number <span class="text-red-500">*</span>
            </label>
            <input
              v-model="formData.plate_number"
              type="text"
              required
              class="w-full px-4 py-2.5 md:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition text-sm md:text-base uppercase"
              placeholder="B1234XYZ"
            />
            <p class="text-xs text-gray-500 mt-1">Format: B1234XYZ (Indonesia)</p>
          </div>

          <!-- Phone -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              Phone Number
            </label>
            <input
              v-model="formData.phone"
              type="tel"
              class="w-full px-4 py-2.5 md:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition text-sm md:text-base"
              placeholder="+62812345678"
            />
          </div>

          <!-- Submit Button -->
          <button
            @click="handleRegister"
            :disabled="loading"
            class="w-full bg-green-500 hover:bg-green-600 disabled:bg-gray-300 text-white font-semibold py-2.5 md:py-3 px-4 rounded-lg transition duration-200 flex items-center justify-center shadow-lg text-sm md:text-base mt-6"
          >
            <template v-if="loading">
              <svg class="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Creating Account...
            </template>
            <template v-else>
              <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
              </svg>
              Create Account
            </template>
          </button>
        </div>

        <!-- Footer -->
        <div class="mt-6 text-center">
          <p class="text-sm text-gray-600">
            Already have an account?
            <router-link to="/login" class="text-green-500 hover:text-green-600 font-semibold">
              Sign In
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
  full_name: '',
  email: '',
  password: '',
  role: 'resident',
  unit_number: '',
  phone: '',
  plate_number: ''
})

const confirmPassword = ref('')
const loading = ref(false)
const error = ref('')
const success = ref('')
const showPassword = ref(false)

const handleRegister = async () => {
  error.value = ''
  success.value = ''

  // Validation
  if (!formData.value.full_name || !formData.value.email || !formData.value.password) {
    error.value = 'Please fill all required fields'
    return
  }

  if (formData.value.password.length < 6) {
    error.value = 'Password must be at least 6 characters'
    return
  }

  if (formData.value.password !== confirmPassword.value) {
    error.value = 'Passwords do not match'
    return
  }

  loading.value = true

  try {
    const response = await axios.post(
      `${import.meta.env.VITE_API_URL}/auth/register`,
      formData.value
    )

    if (response.data.success) {
      success.value = 'Account created successfully! Redirecting to login...'
      
      // Store token and user data
      localStorage.setItem('token', response.data.token)
      localStorage.setItem('user', JSON.stringify(response.data.user))
      
      // Redirect after 2 seconds
      setTimeout(() => {
        router.push('/')
      }, 2000)
    } else {
      error.value = response.data.error || 'Registration failed'
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
  input, select {
    font-size: 16px; /* Prevent zoom on iOS */
  }
}

/* Scrollbar styling */
.overflow-y-auto::-webkit-scrollbar {
  width: 6px;
}

.overflow-y-auto::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 10px;
}

.overflow-y-auto::-webkit-scrollbar-thumb {
  background: #888;
  border-radius: 10px;
}

.overflow-y-auto::-webkit-scrollbar-thumb:hover {
  background: #555;
}
</style>