import { createRouter, createWebHistory } from 'vue-router'
import LoginView from '@/features/auth/views/LoginView.vue'
import { redirectIfAuthenticated } from './guards'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: '/login', name: 'login', component: LoginView, beforeEnter: redirectIfAuthenticated },
  ],
})

export default router
