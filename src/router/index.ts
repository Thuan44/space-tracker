import { createRouter, createWebHistory } from 'vue-router'
import LoginView from '@/features/auth/views/LoginView.vue'
import DashboardView from '@/features/dashboard/views/DashboardView.vue'
import SystemsView from '@/features/systems/views/SystemsView.vue'
import SystemDetailView from '@/features/systems/views/SystemDetailView.vue'
import FleetView from '@/features/fleet/views/FleetView.vue'
import { redirectIfAuthenticated, requireAuth } from './guards'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: '/login', name: 'login', component: LoginView, beforeEnter: redirectIfAuthenticated },
    { path: '/', name: 'dashboard', component: DashboardView, beforeEnter: requireAuth },
    { path: '/systems', name: 'systems', component: SystemsView, beforeEnter: requireAuth },
    {
      path: '/systems/:systemSymbol',
      name: 'system-detail',
      component: SystemDetailView,
      beforeEnter: requireAuth,
    },
    { path: '/fleet', name: 'fleet', component: FleetView, beforeEnter: requireAuth },
  ],
})

export default router
