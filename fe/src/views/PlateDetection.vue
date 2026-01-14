<template>
  <div class="min-h-screen bg-gray-50 p-6">
    <div class="max-w-6xl mx-auto space-y-6">
      
      <!-- Header -->
      <div class="bg-white rounded-xl shadow-md p-6">
        <h1 class="text-3xl font-bold text-gray-800 mb-2">License Plate Detection</h1>
        <p class="text-gray-600">Scan license plates using camera or upload image</p>
      </div>

      <!-- Mode Tabs -->
      <div class="bg-white rounded-xl shadow-md p-6">
        <div class="flex space-x-4 border-b border-gray-200 mb-6">
          <button
            @click="mode = 'camera'"
            :class="[
              'px-6 py-3 font-semibold transition border-b-2',
              mode === 'camera' 
                ? 'text-primary-blue border-primary-blue' 
                : 'text-gray-500 border-transparent hover:text-gray-700'
            ]"
          >
            <CameraIcon class="w-5 h-5 inline mr-2" />
            Camera
          </button>
          <button
            @click="mode = 'upload'"
            :class="[
              'px-6 py-3 font-semibold transition border-b-2',
              mode === 'upload' 
                ? 'text-primary-blue border-primary-blue' 
                : 'text-gray-500 border-transparent hover:text-gray-700'
            ]"
          >
            <PhotoIcon class="w-5 h-5 inline mr-2" />
            Upload
          </button>
        </div>

        <!-- Camera Mode -->
        <div v-if="mode === 'camera'" class="space-y-4">
          <div class="relative bg-gray-900 rounded-lg overflow-hidden" style="aspect-ratio: 16/9;">
            <video
              ref="videoElement"
              autoplay
              playsinline
              class="w-full h-full object-cover"
            ></video>
            <canvas ref="canvasElement" class="hidden"></canvas>
            
            <!-- Camera overlay -->
            <div class="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div class="border-4 border-green-500 border-dashed rounded-lg w-3/4 h-2/3 opacity-50"></div>
            </div>
          </div>

          <div class="flex space-x-4">
            <button
              v-if="!cameraActive"
              @click="startCamera"
              class="flex-1 bg-primary-blue hover:bg-blue-600 text-white font-semibold py-3 px-6 rounded-lg transition"
            >
              <CameraIcon class="w-5 h-5 inline mr-2" />
              Start Camera
            </button>
            <button
              v-else
              @click="captureAndScan"
              :disabled="scanning"
              class="flex-1 bg-green-500 hover:bg-green-600 disabled:bg-gray-300 text-white font-semibold py-3 px-6 rounded-lg transition"
            >
              {{ scanning ? 'Scanning...' : 'Capture & Scan' }}
            </button>
            <button
              v-if="cameraActive"
              @click="stopCamera"
              class="bg-red-500 hover:bg-red-600 text-white font-semibold py-3 px-6 rounded-lg transition"
            >
              Stop Camera
            </button>
          </div>
        </div>

        <!-- Upload Mode -->
        <div v-if="mode === 'upload'" class="space-y-4">
          <div
            @drop.prevent="handleDrop"
            @dragover.prevent="dragOver = true"
            @dragleave.prevent="dragOver = false"
            :class="[
              'border-4 border-dashed rounded-lg p-12 text-center transition',
              dragOver ? 'border-primary-blue bg-blue-50' : 'border-gray-300'
            ]"
          >
            <input
              ref="fileInput"
              type="file"
              accept="image/*"
              @change="handleFileSelect"
              class="hidden"
            />
            
            <div v-if="!uploadedImage">
              <PhotoIcon class="w-16 h-16 mx-auto text-gray-400 mb-4" />
              <p class="text-gray-600 mb-2">Drag & drop image here or</p>
              <button
                @click="$refs.fileInput.click()"
                class="bg-primary-blue hover:bg-blue-600 text-white font-semibold py-2 px-6 rounded-lg transition"
              >
                Browse Files
              </button>
            </div>

            <div v-else class="space-y-4">
              <img :src="uploadedImage" alt="Uploaded" class="max-h-96 mx-auto rounded-lg" />
              <div class="flex space-x-4 justify-center">
                <button
                  @click="scanUploadedImage"
                  :disabled="scanning"
                  class="bg-green-500 hover:bg-green-600 disabled:bg-gray-300 text-white font-semibold py-2 px-6 rounded-lg transition"
                >
                  {{ scanning ? 'Scanning...' : 'Scan Plate' }}
                </button>
                <button
                  @click="clearUpload"
                  class="bg-gray-300 hover:bg-gray-400 text-gray-800 font-semibold py-2 px-6 rounded-lg transition"
                >
                  Clear
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Results -->
      <div v-if="result" class="bg-white rounded-xl shadow-md p-6">
        <h2 class="text-2xl font-bold text-gray-800 mb-4">Detection Result</h2>
        
        <div v-if="result.success" class="space-y-4">
          <!-- Plate Info -->
          <div class="bg-green-50 border-2 border-green-500 rounded-lg p-6">
            <div class="flex items-center justify-between mb-4">
              <div>
                <p class="text-sm text-gray-600 mb-1">Detected Plate Number</p>
                <p class="text-4xl font-bold text-gray-900">{{ result.plate_number }}</p>
              </div>
              <div class="text-right">
                <p class="text-sm text-gray-600">Confidence</p>
                <p class="text-2xl font-bold text-green-600">{{ (result.confidence * 100).toFixed(1) }}%</p>
              </div>
            </div>
            <p class="text-sm text-gray-600">Region: <span class="font-semibold">{{ result.region }}</span></p>
          </div>

          <!-- Verification Status -->
          <div v-if="result.verified" class="bg-blue-50 border-2 border-blue-500 rounded-lg p-6">
            <div class="flex items-center mb-4">
              <CheckCircleIcon class="w-8 h-8 text-blue-600 mr-3" />
              <h3 class="text-xl font-bold text-gray-900">Verified Resident</h3>
            </div>
            <div class="grid grid-cols-2 gap-4">
              <div>
                <p class="text-sm text-gray-600">Name</p>
                <p class="font-semibold text-gray-900">{{ result.resident.name }}</p>
              </div>
              <div>
                <p class="text-sm text-gray-600">Unit</p>
                <p class="font-semibold text-gray-900">{{ result.resident.unit }}</p>
              </div>
              <div>
                <p class="text-sm text-gray-600">Phone</p>
                <p class="font-semibold text-gray-900">{{ result.resident.phone }}</p>
              </div>
              <div>
                <p class="text-sm text-gray-600">Registered Plate</p>
                <p class="font-semibold text-gray-900">{{ result.resident.plate_number }}</p>
              </div>
            </div>

            <!-- Gate Control -->
            <div class="mt-6 flex space-x-4">
              <button
                @click="openGate"
                :disabled="gateOpening"
                class="flex-1 bg-green-500 hover:bg-green-600 disabled:bg-gray-300 text-white font-bold py-4 px-6 rounded-lg transition text-lg"
              >
                {{ gateOpening ? 'Opening...' : '🚪 OPEN GATE' }}
              </button>
            </div>
          </div>

          <div v-else class="bg-red-50 border-2 border-red-500 rounded-lg p-6">
            <div class="flex items-center">
              <XCircleIcon class="w-8 h-8 text-red-600 mr-3" />
              <div>
                <h3 class="text-xl font-bold text-gray-900">Not Authorized</h3>
                <p class="text-gray-600">This plate number is not registered in the system</p>
              </div>
            </div>
          </div>
        </div>

        <div v-else class="bg-yellow-50 border-2 border-yellow-500 rounded-lg p-6">
          <div class="flex items-center">
            <ExclamationTriangleIcon class="w-8 h-8 text-yellow-600 mr-3" />
            <div>
              <h3 class="text-xl font-bold text-gray-900">No Plate Detected</h3>
              <p class="text-gray-600">{{ result.error }}</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Recent Scans -->
      <div v-if="recentScans.length > 0" class="bg-white rounded-xl shadow-md p-6">
        <h2 class="text-2xl font-bold text-gray-800 mb-4">Recent Scans</h2>
        <div class="space-y-2">
          <div
            v-for="(scan, index) in recentScans"
            :key="index"
            class="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
          >
            <div class="flex items-center space-x-4">
              <span class="text-2xl font-bold text-gray-900">{{ scan.plate_number }}</span>
              <span :class="[
                'px-3 py-1 rounded-full text-sm font-semibold',
                scan.verified ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
              ]">
                {{ scan.verified ? 'Granted' : 'Denied' }}
              </span>
            </div>
            <span class="text-sm text-gray-600">{{ scan.time }}</span>
          </div>
        </div>
      </div>

    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { CameraIcon, PhotoIcon, CheckCircleIcon, XCircleIcon, ExclamationTriangleIcon } from '@heroicons/vue/24/outline'
import api from '../services/api'

const mode = ref('camera')
const cameraActive = ref(false)
const scanning = ref(false)
const gateOpening = ref(false)
const dragOver = ref(false)

const videoElement = ref(null)
const canvasElement = ref(null)
const fileInput = ref(null)
const uploadedImage = ref(null)
const uploadedFile = ref(null)

const result = ref(null)
const recentScans = ref([])

// Camera functions
const startCamera = async () => {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ 
      video: { facingMode: 'environment', width: 1280, height: 720 } 
    })
    videoElement.value.srcObject = stream
    cameraActive.value = true
  } catch (error) {
    console.error('Error accessing camera:', error)
    alert('Could not access camera. Please check permissions.')
  }
}

const stopCamera = () => {
  const stream = videoElement.value.srcObject
  if (stream) {
    stream.getTracks().forEach(track => track.stop())
  }
  cameraActive.value = false
}

const captureAndScan = async () => {
  const canvas = canvasElement.value
  const video = videoElement.value
  
  canvas.width = video.videoWidth
  canvas.height = video.videoHeight
  canvas.getContext('2d').drawImage(video, 0, 0)
  
  canvas.toBlob(async (blob) => {
    await scanImage(blob, 'camera-capture.jpg')
  }, 'image/jpeg', 0.95)
}

// Upload functions
const handleFileSelect = (event) => {
  const file = event.target.files[0]
  if (file) {
    uploadedFile.value = file
    const reader = new FileReader()
    reader.onload = (e) => {
      uploadedImage.value = e.target.result
    }
    reader.readAsDataURL(file)
  }
}

const handleDrop = (event) => {
  dragOver.value = false
  const file = event.dataTransfer.files[0]
  if (file && file.type.startsWith('image/')) {
    uploadedFile.value = file
    const reader = new FileReader()
    reader.onload = (e) => {
      uploadedImage.value = e.target.result
    }
    reader.readAsDataURL(file)
  }
}

const clearUpload = () => {
  uploadedImage.value = null
  uploadedFile.value = null
  if (fileInput.value) {
    fileInput.value.value = ''
  }
}

const scanUploadedImage = async () => {
  if (uploadedFile.value) {
    await scanImage(uploadedFile.value, uploadedFile.value.name)
  }
}

// Scan image
const scanImage = async (imageBlob, filename) => {
  try {
    scanning.value = true
    result.value = null

    const formData = new FormData()
    formData.append('image', imageBlob, filename)

    const response = await api.scanLicensePlate(formData)
    result.value = response.data

    // Add to recent scans
    if (response.data.success) {
      recentScans.value.unshift({
        plate_number: response.data.plate_number,
        verified: response.data.verified,
        time: new Date().toLocaleTimeString()
      })
      if (recentScans.value.length > 10) {
        recentScans.value.pop()
      }
    }

  } catch (error) {
    console.error('Error scanning plate:', error)
    result.value = {
      success: false,
      error: error.response?.data?.error || 'Failed to scan plate. Please try again.'
    }
  } finally {
    scanning.value = false
  }
}

// Gate control
const openGate = async () => {
  try {
    gateOpening.value = true
    await api.openGate({
      triggered_by: result.value.resident.name,
      plate_number: result.value.plate_number,
      reason: 'License Plate Detection'
    })
    alert('Gate opened successfully!')
  } catch (error) {
    console.error('Error opening gate:', error)
    alert('Failed to open gate')
  } finally {
    gateOpening.value = false
  }
}

// Cleanup
onUnmounted(() => {
  if (cameraActive.value) {
    stopCamera()
  }
})
</script>

<style scoped>
video {
  transform: scaleX(-1);
}
</style>
