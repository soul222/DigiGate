<template>
  <div>
    <h1 class="text-3xl font-bold text-gray-800 mb-6">Settings</h1>
    
    <div class="bg-white rounded-xl shadow-md p-6">
      <h2 class="text-xl font-bold text-gray-800 mb-4">System Configuration</h2>
      
      <div class="space-y-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">
            API URL
          </label>
          <input 
            type="text" 
            value="http://localhost:3000"
            class="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-blue"
            readonly
          />
        </div>
        
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">
            ANPR Confidence Threshold
          </label>
          <input 
            type="range" 
            min="0" 
            max="100" 
            value="50"
            class="w-full"
          />
          <span class="text-sm text-gray-600">50%</span>
        </div>
        
        <button class="bg-primary-blue text-white px-6 py-2 rounded-lg hover:bg-blue-600">
          Save Settings
        </button>
      </div>
    </div>
  </div>
</template>