import { createRouter, createWebHistory } from 'vue-router'
import { redirectIfAuthenticated, requireAuth } from './guards'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/login',
      name: 'login',
      component: () => import('@/features/auth/views/LoginView.vue'),
      beforeEnter: redirectIfAuthenticated,
    },
    {
      path: '/',
      name: 'dashboard',
      component: () => import('@/features/dashboard/views/DashboardView.vue'),
      beforeEnter: requireAuth,
    },
    {
      path: '/systems',
      name: 'systems',
      component: () => import('@/features/systems/views/SystemsView.vue'),
      beforeEnter: requireAuth,
    },
    {
      path: '/systems/:systemSymbol',
      name: 'system-detail',
      component: () => import('@/features/systems/views/SystemDetailView.vue'),
      beforeEnter: requireAuth,
    },
    {
      path: '/fleet',
      name: 'fleet',
      component: () => import('@/features/fleet/views/FleetView.vue'),
      beforeEnter: requireAuth,
    },
    {
      path: '/fleet/:shipSymbol',
      name: 'fleet-detail',
      component: () => import('@/features/fleet/views/FleetDetailView.vue'),
      beforeEnter: requireAuth,
    },
    {
      path: '/markets/:waypointSymbol',
      name: 'market',
      component: () => import('@/features/markets/views/MarketView.vue'),
      beforeEnter: requireAuth,
    },
    {
      path: '/:pathMatch(.*)*',
      name: 'not-found',
      component: () => import('@/features/not-found/views/NotFoundView.vue'),
    },
  ],
})

export default router
