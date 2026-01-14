<template>
  <footer class="bg-white border-t mt-auto">
    <div class="container mx-auto px-6 py-8">
      <div class="grid grid-cols-1 md:grid-cols-4 gap-8">
        <!-- Brand -->
        <div class="col-span-1">
          <div class="flex items-center space-x-3 mb-4">
            <div class="w-10 h-10 bg-primary-blue rounded-lg flex items-center justify-center">
              <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
            </div>
            <div>
              <h3 class="text-lg font-bold text-gray-800">DigiGate</h3>
              <p class="text-xs text-gray-500">Smart Security</p>
            </div>
          </div>
          <p class="text-sm text-gray-600">
            Automatic Number Plate Recognition system for smart gate control and security management.
          </p>
        </div>

        <!-- Quick Links -->
        <div>
          <h4 class="font-semibold text-gray-800 mb-4">Quick Links</h4>
          <ul class="space-y-2">
            <li>
              <router-link to="/" class="text-sm text-gray-600 hover:text-primary-blue transition">
                Dashboard
              </router-link>
            </li>
            <li>
              <router-link to="/vehicles" class="text-sm text-gray-600 hover:text-primary-blue transition">
                Vehicles
              </router-link>
            </li>
            <li>
              <router-link to="/logs" class="text-sm text-gray-600 hover:text-primary-blue transition">
                Access Logs
              </router-link>
            </li>
            <li>
              <router-link to="/visitors" class="text-sm text-gray-600 hover:text-primary-blue transition">
                Visitors
              </router-link>
            </li>
          </ul>
        </div>

        <!-- Support -->
        <div>
          <h4 class="font-semibold text-gray-800 mb-4">Support</h4>
          <ul class="space-y-2">
            <li>
              <a href="#" class="text-sm text-gray-600 hover:text-primary-blue transition">
                Documentation
              </a>
            </li>
            <li>
              <a href="#" class="text-sm text-gray-600 hover:text-primary-blue transition">
                API Reference
              </a>
            </li>
            <li>
              <a href="#" class="text-sm text-gray-600 hover:text-primary-blue transition">
                Help Center
              </a>
            </li>
            <li>
              <a href="#" class="text-sm text-gray-600 hover:text-primary-blue transition">
                Contact Us
              </a>
            </li>
          </ul>
        </div>

        <!-- Tech Stack -->
        <div>
          <h4 class="font-semibold text-gray-800 mb-4">Technology</h4>
          <div class="space-y-3">
            <div class="flex items-center space-x-2">
              <div class="w-8 h-8 bg-green-100 rounded flex items-center justify-center">
                <span class="text-xs font-bold text-green-600">V</span>
              </div>
              <span class="text-sm text-gray-600">Vue.js 3</span>
            </div>
            <div class="flex items-center space-x-2">
              <div class="w-8 h-8 bg-blue-100 rounded flex items-center justify-center">
                <span class="text-xs font-bold text-blue-600">T</span>
              </div>
              <span class="text-sm text-gray-600">Tailwind CSS</span>
            </div>
            <div class="flex items-center space-x-2">
              <div class="w-8 h-8 bg-yellow-100 rounded flex items-center justify-center">
                <span class="text-xs font-bold text-yellow-600">Y</span>
              </div>
              <span class="text-sm text-gray-600">YOLO v11</span>
            </div>
            <div class="flex items-center space-x-2">
              <div class="w-8 h-8 bg-purple-100 rounded flex items-center justify-center">
                <span class="text-xs font-bold text-purple-600">E</span>
              </div>
              <span class="text-sm text-gray-600">ESP32-CAM</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Bottom Bar -->
      <div class="mt-8 pt-8 border-t">
        <div class="flex flex-col md:flex-row items-center justify-between">
          <p class="text-sm text-gray-600">
            © {{ currentYear }} DigiGate. All rights reserved.
          </p>
          
          <div class="flex items-center space-x-6 mt-4 md:mt-0">
            <a href="#" class="text-gray-600 hover:text-primary-blue transition">
              <span class="sr-only">GitHub</span>
              <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path fill-rule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clip-rule="evenodd" />
              </svg>
            </a>
            
            <a href="#" class="text-gray-600 hover:text-primary-blue transition">
              <span class="sr-only">Documentation</span>
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </a>
          </div>
        </div>
        
        <!-- System Status -->
        <div class="mt-4 flex items-center justify-center space-x-4 text-xs text-gray-500">
          <div class="flex items-center space-x-1">
            <div class="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span>Backend: Online</span>
          </div>
          <div class="flex items-center space-x-1">
            <div class="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span>ANPR: Online</span>
          </div>
          <div class="flex items-center space-x-1">
            <div class="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
            <span>Database: Connected</span>
          </div>
        </div>
      </div>
    </div>
  </footer>
</template>

<script setup>
import { ref, computed } from 'vue'

const currentYear = computed(() => new Date().getFullYear())
</script>