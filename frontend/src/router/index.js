import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/login',
      name: 'login',
      component: () => import('../src/views/LoginView.vue')
    },
    {
      path: '/register',
      name: 'register',
      component: () => import('../src/views/RegisterView.vue')
    },
    {
      path: '/',
      name: 'home',
      component: () => import('../src/views/HomeView.vue')
    }
  ]
})

export default router
