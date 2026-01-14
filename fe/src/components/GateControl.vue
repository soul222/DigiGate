<template>
  <div class="bg-white rounded-xl shadow-md p-6">
    <h2 class="text-xl font-bold text-gray-800 mb-6">Gate Control</h2>
    
    <div class="space-y-4">
      <!-- Open Gate Button -->
      <button
        @click="$emit('gate-action', 'open')"
        :disabled="loading"
        class="w-full bg-primary-blue hover:bg-blue-600 disabled:bg-gray-300 text-white font-semibold py-4 px-6 rounded-lg transition duration-200 flex items-center justify-center space-x-2"
      >
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z" />
        </svg>
        <span>OPEN GATE</span>
      </button>

      <!-- Close Gate Button -->
      <button
        @click="$emit('gate-action', 'close')"
        :disabled="loading"
        class="w-full bg-primary-red hover:bg-red-600 disabled:bg-gray-300 text-white font-semibold py-4 px-6 rounded-lg transition duration-200 flex items-center justify-center space-x-2"
      >
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
        <span>CLOSE GATE</span>
      </button>

      <!-- Capture Image Button -->
      <button
        @click="captureImage"
        :disabled="loading"
        class="w-full bg-gray-700 hover:bg-gray-800 disabled:bg-gray-300 text-white font-semibold py-4 px-6 rounded-lg transition duration-200 flex items-center justify-center space-x-2"
      >
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
        <span>CAPTURE IMAGE</span>
      </button>
    </div>

    <!-- Upload Image Section -->
    <div class="mt-6 border-t pt-6">
      <label class="block text-sm font-medium text-gray-700 mb-2">
        Or Upload Image
      </label>
      <input
        type="file"
        accept="image/*"
        @change="handleImageUpload"
        ref="fileInput"
        class="block w-full text-sm text-gray-500
          file:mr-4 file:py-2 file:px-4
          file:rounded-lg file:border-0
          file:text-sm file:font-semibold
          file:bg-blue-50 file:text-primary-blue
          hover:file:bg-blue-100
          cursor-pointer"
      />
      
      <div v-if="uploadProgress > 0" class="mt-4">
        <div class="w-full bg-gray-200 rounded-full h-2">
          <div 
            class="bg-primary-blue h-2 rounded-full transition-all duration-300" 
            :style="`width: ${uploadProgress}%`"
          ></div>
        </div>
        <p class="text-sm text-gray-600 mt-2 text-center">Processing: {{ uploadProgress }}%</p>
      </div>

      <!-- Result -->
      <div v-if="result" class="mt-4 p-4 rounded-lg" :class="result.authorized ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'">
        <div class="flex items-center justify-between">
          <div>
            <p class="font-semibold" :class="result.authorized ? 'text-green-800' : 'text-red-800'">
              {{ result.plateNumber }}
            </p>
            <p class="text-sm" :class="result.authorized ? 'text-green-600' : 'text-red-600'">
              Confidence: {{ (result.confidence * 100).toFixed(1) }}%
            </p>
          </div>
          <span 
            class="px-3 py-1 rounded-full text-xs font-semibold"
            :class="result.authorized ? 'bg-green-200 text-green-800' : 'bg-red-200 text-red-800'"
          >
            {{ result.authorized ? 'AUTHORIZED' : 'REJECTED' }}
          </span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import api from '@/services/api'

defineEmits(['gate-action'])

const loading = ref(false)
const uploadProgress = ref(0)
const result = ref(null)
const fileInput = ref(null)

const captureImage = () => {
  console.log('🎥 Capture image from ESP32-CAM')
  // Trigger ESP32-CAM capture via MQTT or HTTP
}

const handleImageUpload = async (event) => {
  const file = event.target.files[0]
  if (!file) return
  
  result.value = null
  loading.value = true
  uploadProgress.value = 0
  
  const formData = new FormData()
  formData.append('image', file)
  
  try {
    uploadProgress.value = 30
    
    const response = await api.processAccess(formData)
    
    uploadProgress.value = 100
    
    result.value = {
      plateNumber: response.data.plateNumber,
      confidence: response.data.confidence,
      authorized: response.data.authorized
    }
    
    // Reset after 5 seconds
    setTimeout(() => {
      uploadProgress.value = 0
      result.value = null
      if (fileInput.value) {
        fileInput.value.value = ''
      }
    }, 5000)
    
  } catch (error) {
    console.error('Error uploading image:', error)
    alert('Failed to process image')
    uploadProgress.value = 0
  } finally {
    loading.value = false
  }
}
</script>