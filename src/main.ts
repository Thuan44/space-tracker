import '@fontsource/ibm-plex-mono/400.css'
import '@fontsource/ibm-plex-mono/500.css'
import '@fontsource/ibm-plex-mono/600.css'
import '@fontsource/ibm-plex-mono/700.css'
import './assets/main.css'

import { createApp } from 'vue'
import { createPinia } from 'pinia'
import PrimeVue from 'primevue/config'
import { VueQueryPlugin } from '@tanstack/vue-query'

import App from './App.vue'
import router from './router'
import { primeVueOptions } from './plugins/primevue'

const app = createApp(App)

app.use(createPinia())
app.use(router)
app.use(PrimeVue, primeVueOptions)
app.use(VueQueryPlugin)

app.mount('#app')
