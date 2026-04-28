import { createApp } from 'vue'
import { createPinia } from 'pinia'
import PrimeVue from 'primevue/config'
import 'primeicons/primeicons.css'

import Aura from '@primeuix/themes/aura'
import IconField from 'primevue/iconfield'
import InputIcon from 'primevue/inputicon'
import Toast from 'primevue/toast'
import ToastService from 'primevue/toastservice'
import axios from 'axios'

import './style.css'
import App from './App.vue'
import router from './router'

const app = createApp(App)



axios.defaults.baseURL = import.meta.env.VITE_API_BASE_URL || '/api'

axios.interceptors.request.use(config => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
}, error => {
  return Promise.reject(error)
})

app.use(createPinia())
app.use(router)
app.use(PrimeVue, {
  theme: {
    preset: Aura,
    options: {
      darkModeSelector: '.dark',
      cssLayer: {
        name: 'primevue',
        order: 'tailwind, primevue'
      }
    }
  }
})
app.use(ToastService)
app.component('Toast', Toast)

app.mount('#app')
