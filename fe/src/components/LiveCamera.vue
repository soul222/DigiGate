<template>
  <div class="bg-white rounded-xl shadow-md overflow-hidden">
    <div class="p-6 border-b bg-gradient-to-r from-primary-blue to-blue-600">
      <div class="flex items-center justify-between">
        <div class="flex items-center space-x-3">
          <div
            class="w-10 h-10 bg-white bg-opacity-20 rounded-lg flex items-center justify-center"
          >
            <VideoCameraIcon class="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 class="text-xl font-bold text-white">Live Camera Feed</h2>
            <p class="text-sm text-blue-100">ESP32-CAM Gate Monitor</p>
          </div>
        </div>

        <div class="flex items-center space-x-2">
          <div
            :class="[
              'w-3 h-3 rounded-full',
              isConnected ? 'bg-green-400 animate-pulse' : 'bg-red-400',
            ]"
          ></div>
          <span class="text-white text-sm font-medium">
            {{ isConnected ? "LIVE" : "OFFLINE" }}
          </span>
        </div>
      </div>
    </div>

    <!-- Camera View -->
    <div class="relative bg-gray-900" style="aspect-ratio: 16/9">
      <!-- Live Stream -->
      <img
        v-if="isConnected && streamUrl"
        :src="streamUrl"
        alt="Live Camera Feed"
        class="w-full h-full object-contain"
        @error="handleStreamError"
      />

      <!-- Placeholder when offline -->
      <div
        v-else
        class="absolute inset-0 flex items-center justify-center bg-gray-800"
      >
        <div class="text-center">
          <VideoCameraSlashIcon class="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <p class="text-gray-400 text-lg font-medium">Camera Offline</p>
          <p class="text-gray-500 text-sm mt-2">Waiting for connection...</p>
          <button
            @click="reconnect"
            class="mt-4 bg-primary-blue hover:bg-blue-600 text-white px-6 py-2 rounded-lg transition"
          >
            Reconnect
          </button>
        </div>
      </div>

      <!-- Detection Overlay -->
      <div v-if="lastDetection" class="absolute top-4 left-4 right-4">
        <div class="bg-black bg-opacity-70 rounded-lg p-4 text-white">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm text-gray-300">Last Detection</p>
              <p class="text-xl font-bold">{{ lastDetection.plate_number }}</p>
              <p class="text-xs text-gray-400 mt-1">
                Confidence: {{ (lastDetection.confidence * 100).toFixed(1) }}%
              </p>
            </div>
            <div
              :class="[
                'px-4 py-2 rounded-lg font-semibold text-sm',
                lastDetection.authorized ? 'bg-green-500' : 'bg-red-500',
              ]"
            >
              {{ lastDetection.authorized ? "AUTHORIZED" : "REJECTED" }}
            </div>
          </div>
        </div>
      </div>

      <!-- Recording Indicator -->
      <div v-if="isRecording" class="absolute top-4 right-4">
        <div
          class="bg-red-600 rounded-full px-4 py-2 flex items-center space-x-2 animate-pulse"
        >
          <div class="w-3 h-3 bg-white rounded-full"></div>
          <span class="text-white text-sm font-semibold">REC</span>
        </div>
      </div>

      <!-- Timestamp -->
      <div
        class="absolute bottom-4 right-4 bg-black bg-opacity-70 rounded px-3 py-1"
      >
        <p class="text-white text-sm font-mono">{{ currentTime }}</p>
      </div>
    </div>

    <!-- Controls -->
    <div class="p-6 bg-gray-50 border-t">
      <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
        <!-- Capture Photo -->
        <button
          @click="capturePhoto"
          :disabled="!isConnected"
          class="flex items-center justify-center space-x-2 bg-primary-blue hover:bg-blue-600 disabled:bg-gray-300 text-white font-semibold py-3 px-4 rounded-lg transition"
        >
          <CameraIcon class="w-5 h-5" />
          <span>Capture</span>
        </button>

        <!-- Record Video -->
        <button
          @click="toggleRecording"
          :disabled="!isConnected"
          :class="[
            'flex items-center justify-center space-x-2 font-semibold py-3 px-4 rounded-lg transition',
            isRecording
              ? 'bg-red-600 hover:bg-red-700 text-white'
              : 'bg-gray-700 hover:bg-gray-800 text-white disabled:bg-gray-300',
          ]"
        >
          <component :is="isRecording ? StopIcon : PlayIcon" class="w-5 h-5" />
          <span>{{ isRecording ? "Stop" : "Record" }}</span>
        </button>

        <!-- Refresh Stream -->
        <button
          @click="refreshStream"
          :disabled="!isConnected"
          class="flex items-center justify-center space-x-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-300 text-white font-semibold py-3 px-4 rounded-lg transition"
        >
          <ArrowPathIcon class="w-5 h-5" />
          <span>Refresh</span>
        </button>

        <!-- Settings -->
        <button
          @click="showSettings = !showSettings"
          class="flex items-center justify-center space-x-2 bg-gray-700 hover:bg-gray-800 text-white font-semibold py-3 px-4 rounded-lg transition"
        >
          <CogIcon class="w-5 h-5" />
          <span>Settings</span>
        </button>
      </div>

      <!-- Settings Panel -->
      <div v-if="showSettings" class="mt-4 p-4 bg-white rounded-lg border">
        <h3 class="font-semibold text-gray-800 mb-3">Camera Settings</h3>

        <div class="space-y-3">
          <div>
            <label class="block text-sm text-gray-700 mb-1">Stream URL</label>
            <input
              v-model="cameraUrl"
              type="text"
              class="w-full px-3 py-2 border rounded-lg text-sm"
              placeholder="http://192.168.1.100:81/stream"
            />
          </div>

          <div>
            <label class="block text-sm text-gray-700 mb-1">Resolution</label>
            <select
              v-model="resolution"
              class="w-full px-3 py-2 border rounded-lg text-sm"
            >
              <option value="QVGA">QVGA (320x240)</option>
              <option value="VGA">VGA (640x480)</option>
              <option value="SVGA">SVGA (800x600)</option>
              <option value="XGA">XGA (1024x768)</option>
              <option value="HD">HD (1280x720)</option>
            </select>
          </div>

          <div class="flex items-center justify-between">
            <label class="text-sm text-gray-700">Auto Detection</label>
            <button
              @click="autoDetection = !autoDetection"
              :class="[
                'relative inline-flex h-6 w-11 items-center rounded-full transition-colors',
                autoDetection ? 'bg-primary-blue' : 'bg-gray-300',
              ]"
            >
              <span
                :class="[
                  'inline-block h-4 w-4 transform rounded-full bg-white transition-transform',
                  autoDetection ? 'translate-x-6' : 'translate-x-1',
                ]"
              />
            </button>
          </div>

          <button
            @click="applySettings"
            class="w-full bg-primary-blue hover:bg-blue-600 text-white font-semibold py-2 px-4 rounded-lg transition"
          >
            Apply Settings
          </button>
        </div>
      </div>
    </div>

    <!-- Recent Captures -->
    <div v-if="recentCaptures.length > 0" class="p-6 border-t">
      <h3 class="font-semibold text-gray-800 mb-4">Recent Captures</h3>
      <div class="grid grid-cols-4 gap-4">
        <div
          v-for="(capture, index) in recentCaptures"
          :key="index"
          class="relative group cursor-pointer rounded-lg overflow-hidden border hover:border-primary-blue transition"
          @click="viewCapture(capture)"
        >
          <img
            :src="capture.url"
            alt="Capture"
            class="w-full h-24 object-cover"
          />
          <div
            class="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition flex items-center justify-center"
          >
            <EyeIcon
              class="w-6 h-6 text-white opacity-0 group-hover:opacity-100 transition"
            />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, computed } from 'vue'
import {
  VideoCameraIcon,
  VideoCameraSlashIcon,
  CameraIcon,
  CogIcon,
  ArrowPathIcon,
  PlayIcon,
  StopIcon,
  EyeIcon
} from '@heroicons/vue/24/outline'

// State
const isConnected = ref(false)
const streamUrl = ref('')
const cameraUrl = ref('http://192.168.1.100:81/stream')
const lastDetection = ref(null)
const isRecording = ref(false)
const showSettings = ref(false)
const resolution = ref('VGA')
const autoDetection = ref(true)
const currentTime = ref('')
const recentCaptures = ref([])
let timeInterval = null
let reconnectInterval = null
// Computed
const connectionStatus = computed(() => {
return isConnected.value ? 'Connected' : 'Disconnected'
})
// Methods
const connectToCamera = async () => {
  try {
    streamUrl.value = `${cameraUrl.value}?t=${Date.now()}`;
    isConnected.value = true;
  } catch (error) {
    isConnected.value = false;
    console.error('Failed to connect to camera:', error);
  }
}
const reconnectToCamera = () => {
  connectToCamera()
}
const refreshCameraStream = () => {
  streamUrl.value = `${cameraUrl.value}?t=${Date.now()}`;
}
const handleStreamError = () => {
console.error('❌ Stream error')
isConnected.value = false
// Auto reconnect after 5 seconds
setTimeout(() => {
reconnect()
}, 5000)
}
const capturePhoto = async () => {
if (!isConnected.value) return
try {
// Simulate capture
const capture = {
url: streamUrl.value,
timestamp: new Date().toISOString(),
id: Date.now()
}
recentCaptures.value.unshift(capture)

if (recentCaptures.value.length > 8) {
  recentCaptures.value.pop()
}

console.log('📸 Photo captured')
} catch (error) {
console.error('Error capturing photo:', error)
}
}
const toggleRecording = () => {
isRecording.value = !isRecording.value
console.log(isRecording.value ? '🔴 Recording started' : '⏹️ Recording stopped')
}
const applySettings = () => {
connect()
showSettings.value = false
console.log('⚙️ Settings applied')
}
const viewCapture = (capture) => {
window.open(capture.url, '_blank')
}
const updateTime = () => {
const now = new Date()
currentTime.value = now.toLocaleString('id-ID', {
year: 'numeric',
month: '2-digit',
day: '2-digit',
hour: '2-digit',
minute: '2-digit',
second: '2-digit'
})
}
// Lifecycle
onMounted(() => {
connect()
updateTime()
timeInterval = setInterval(updateTime, 1000)
// Simulate detection updates (replace with real Socket.IO)
/*
socket.on('plate-detected', (data) => {
lastDetection.value = data
setTimeout(() => {
lastDetection.value = null
}, 5000)
})
*/
})
onUnmounted(() => {
if (timeInterval) clearInterval(timeInterval)
if (reconnectInterval) clearInterval(reconnectInterval)
})
</script>
