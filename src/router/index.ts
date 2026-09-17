import { createRouter, createWebHistory } from 'vue-router'
import LoginView from '@/features/auth/views/LoginView.vue'
import DashboardView from '@/features/dashboard/views/DashboardView.vue'
import { redirectIfAuthenticated, requireAuth } from './guards'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: '/login', name: 'login', component: LoginView, beforeEnter: redirectIfAuthenticated },
    { path: '/', name: 'dashboard', component: DashboardView, beforeEnter: requireAuth },
  ],
})

export default router
