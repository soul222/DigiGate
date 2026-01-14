<template>
  <div class="min-h-screen bg-gray-50 p-6">
    <div class="max-w-4xl mx-auto">
      <!-- Header -->
      <div class="mb-8">
        <h1 class="text-3xl font-bold text-gray-800">QR Code Scanner</h1>
        <p class="text-gray-600 mt-2">Scan visitor QR codes to verify and grant access</p>
      </div>

      <!-- Scanner Mode Tabs -->
      <div class="bg-white rounded-xl shadow-md p-6 mb-6">
        <div class="flex space-x-4 mb-6">
          <button
            @click="scanMode = 'camera'"
            :class="scanMode === 'camera' ? 'bg-primary-blue text-white' : 'bg-gray-200 text-gray-700'"
            class="flex-1 py-3 px-6 rounded-lg font-semibold transition"
          >
            📸 Camera Scan
          </button>
          <button
            @click="scanMode = 'upload'"
            :class="scanMode === 'upload' ? 'bg-primary-blue text-white' : 'bg-gray-200 text-gray-700'"
            class="flex-1 py-3 px-6 rounded-lg font-semibold transition"
          >
            📁 Upload Image
          </button>
        </div>

        <!-- Camera Mode -->
        <div v-if="scanMode === 'camera'" class="space-y-4">
          <div class="relative bg-black rounded-lg overflow-hidden" style="height: 400px;">
            <video
              ref="videoElement"
              autoplay
              playsinline
              class="w-full h-full object-cover"
            ></video>
            <canvas ref="canvasElement" class="hidden"></canvas>
            
            <!-- Scanning Overlay -->
            <div class="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div class="w-64 h-64 border-4 border-primary-blue rounded-lg"></div>
            </div>
            
            <!-- Status Indicator -->
            <div class="absolute top-4 left-4 bg-black bg-opacity-50 text-white px-4 py-2 rounded-lg">
              {{ cameraStatus }}
            </div>
          </div>

          <div class="flex space-x-3">
            <button
              v-if="!cameraActive"
              @click="startCamera"
              class="flex-1 bg-primary-blue hover:bg-blue-600 text-white font-semibold py-3 px-6 rounded-lg transition"
            >
              Start Camera
            </button>
            <button
              v-else
              @click="stopCamera"
              class="flex-1 bg-red-600 hover:bg-red-700 text-white font-semibold py-3 px-6 rounded-lg transition"
            >
              Stop Camera
            </button>
          </div>
        </div>

        <!-- Upload Mode -->
        <div v-if="scanMode === 'upload'" class="space-y-4">
          <div
            @drop.prevent="handleDrop"
            @dragover.prevent
            class="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center hover:border-primary-blue transition cursor-pointer"
            @click="$refs.fileInput.click()"
          >
            <input
              ref="fileInput"
              type="file"
              accept="image/*"
              @change="handleFileSelect"
              class="hidden"
            />
            <div class="text-gray-600">
              <p class="text-lg font-semibold mb-2">Drop QR code image here</p>
              <p class="text-sm">or click to browse</p>
            </div>
          </div>

          <div v-if="uploadedImage" class="relative">
            <img :src="uploadedImage" alt="Uploaded QR" class="w-full rounded-lg" />
            <button
              @click="uploadedImage = null"
              class="absolute top-2 right-2 bg-red-600 text-white p-2 rounded-full hover:bg-red-700"
            >
              ✕
            </button>
          </div>
        </div>
      </div>

      <!-- Scan Result -->
      <div v-if="scanResult" class="bg-white rounded-xl shadow-md p-6">
        <div v-if="scanResult.success" class="space-y-4">
          <div class="flex items-center justify-between">
            <h2 class="text-2xl font-bold text-green-600">✅ Valid QR Code</h2>
            <span class="px-4 py-2 bg-green-100 text-green-800 rounded-full font-semibold">
              {{ scanResult.data.status.toUpperCase() }}
            </span>
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div>
              <p class="text-sm text-gray-600">Visitor Name</p>
              <p class="font-semibold text-gray-800">{{ scanResult.data.visitor_name }}</p>
            </div>
            <div>
              <p class="text-sm text-gray-600">Phone</p>
              <p class="font-semibold text-gray-800">{{ scanResult.data.phone }}</p>
            </div>
            <div>
              <p class="text-sm text-gray-600">Host Unit</p>
              <p class="font-semibold text-gray-800">{{ scanResult.data.host_unit }}</p>
            </div>
            <div>
              <p class="text-sm text-gray-600">Valid Until</p>
              <p class="font-semibold text-gray-800">{{ formatDate(scanResult.data.valid_until) }}</p>
            </div>
          </div>

          <!-- Gate Control -->
          <div class="pt-4 border-t">
            <button
              @click="openGate"
              :disabled="gateOpening"
              class="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-bold py-4 px-6 rounded-lg transition text-lg"
            >
              {{ gateOpening ? '🚪 Opening Gate...' : '🚪 OPEN GATE' }}
            </button>
          </div>
        </div>

        <div v-else class="text-center py-8">
          <p class="text-2xl font-bold text-red-600 mb-2">❌ Invalid QR Code</p>
          <p class="text-gray-600">{{ scanResult.error }}</p>
        </div>
      </div>

      <!-- Scan History -->
      <div v-if="scanHistory.length > 0" class="bg-white rounded-xl shadow-md p-6 mt-6">
        <h3 class="text-xl font-bold text-gray-800 mb-4">Recent Scans</h3>
        <div class="space-y-3">
          <div
            v-for="(scan, index) in scanHistory"
            :key="index"
            class="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
          >
            <div>
              <p class="font-semibold text-gray-800">{{ scan.visitor_name }}</p>
              <p class="text-sm text-gray-600">{{ scan.time }}</p>
            </div>
            <span
              :class="scan.success ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'"
              class="px-3 py-1 rounded-full text-sm font-semibold"
            >
              {{ scan.success ? 'Granted' : 'Denied' }}
            </span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import jsQR from 'jsqr'
import api from '@/services/api'

// State
const scanMode = ref('camera')
const cameraActive = ref(false)
const cameraStatus = ref('Camera not started')
const videoElement = ref(null)
const canvasElement = ref(null)
const uploadedImage = ref(null)
const scanResult = ref(null)
const gateOpening = ref(false)
const scanHistory = ref([])

let stream = null
let scanInterval = null

// Camera Functions
const startCamera = async () => {
  try {
    stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: 'environment' }
    })
    
    videoElement.value.srcObject = stream
    cameraActive.value = true
    cameraStatus.value = '📸 Scanning...'
    
    // Start scanning loop
    scanInterval = setInterval(scanFromCamera, 500)
  } catch (error) {
    console.error('Camera error:', error)
    cameraStatus.value = '❌ Camera access denied'
    alert('Cannot access camera. Please allow camera permission.')
  }
}

const stopCamera = () => {
  if (stream) {
    stream.getTracks().forEach(track => track.stop())
    stream = null
  }
  
  if (scanInterval) {
    clearInterval(scanInterval)
    scanInterval = null
  }
  
  cameraActive.value = false
  cameraStatus.value = 'Camera stopped'
}

const scanFromCamera = () => {
  if (!videoElement.value || !canvasElement.value) return
  
  const canvas = canvasElement.value
  const video = videoElement.value
  
  canvas.width = video.videoWidth
  canvas.height = video.videoHeight
  
  const ctx = canvas.getContext('2d')
  ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
  
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
  const code = jsQR(imageData.data, imageData.width, imageData.height)
  
  if (code) {
    cameraStatus.value = '✅ QR Code detected!'
    stopCamera()
    verifyQRCode(code.data)
  }
}

// Upload Functions
const handleFileSelect = (event) => {
  const file = event.target.files[0]
  if (file) processImage(file)
}

const handleDrop = (event) => {
  const file = event.dataTransfer.files[0]
  if (file && file.type.startsWith('image/')) {
    processImage(file)
  }
}

const processImage = (file) => {
  const reader = new FileReader()
  
  reader.onload = (e) => {
    uploadedImage.value = e.target.result
    
    const img = new Image()
    img.onload = () => {
      const canvas = document.createElement('canvas')
      canvas.width = img.width
      canvas.height = img.height
      
      const ctx = canvas.getContext('2d')
      ctx.drawImage(img, 0, 0)
      
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
      const code = jsQR(imageData.data, imageData.width, imageData.height)
      
      if (code) {
        verifyQRCode(code.data)
      } else {
        scanResult.value = {
          success: false,
          error: 'No QR code found in image'
        }
      }
    }
    
    img.src = e.target.result
  }
  
  reader.readAsDataURL(file)
}

// Verify QR Code
const verifyQRCode = async (qrData) => {
  try {
    const data = JSON.parse(qrData)
    const response = await api.verifyVisitorQR(data.qr_code)
    
    if (response.data.success) {
      scanResult.value = {
        success: true,
        data: response.data.data
      }
      
      addToHistory({
        visitor_name: response.data.data.visitor_name,
        success: true,
        time: new Date().toLocaleString()
      })
    } else {
      scanResult.value = {
        success: false,
        error: response.data.error || 'Invalid QR code'
      }
      
      addToHistory({
        visitor_name: 'Unknown',
        success: false,
        time: new Date().toLocaleString()
      })
    }
  } catch (error) {
    console.error('Verify error:', error)
    scanResult.value = {
      success: false,
      error: 'Failed to verify QR code'
    }
  }
}

// Gate Control
const openGate = async () => {
  gateOpening.value = true
  
  try {
    // Call backend API to open gate (will trigger Socket.IO broadcast)
    await api.openGate({
      triggered_by: 'qr_scanner',
      visitor_name: scanResult.value.data.visitor_name,
      qr_code: scanResult.value.data.qr_code
    })
    
    alert('✅ Gate opened successfully!')
    
    // Reset after 3 seconds
    setTimeout(() => {
      scanResult.value = null
      gateOpening.value = false
    }, 3000)
  } catch (error) {
    console.error('Gate error:', error)
    alert('Failed to open gate')
    gateOpening.value = false
  }
}

// Helpers
const addToHistory = (scan) => {
  scanHistory.value.unshift(scan)
  if (scanHistory.value.length > 5) {
    scanHistory.value.pop()
  }
}

const formatDate = (dateString) => {
  return new Date(dateString).toLocaleString()
}

// Lifecycle
onUnmounted(() => {
  stopCamera()
})
</script>

<style scoped>
video {
  transform: scaleX(-1); /* Mirror camera */
}
</style>
