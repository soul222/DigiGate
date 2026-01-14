import { createApp } from 'vue'
import { createPinia } from 'pinia' // 1. Tambahkan import Pinia
import './style.css'
import App from './App.vue'
import router from './router' // Jika kamu menggunakan router

const app = createApp(App)
const pinia = createPinia() // 2. Buat instance Pinia

app.use(pinia)   // 3. Pasang Pinia ke aplikasi
app.use(router)  // 4. Pasang router (jika ada)

app.mount('#app') // 5.