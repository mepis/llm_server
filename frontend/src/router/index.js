import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/login',
      name: 'login',
      component: () => import('../views/LoginView.vue')
    },
    {
      path: '/register',
      name: 'register',
      component: () => import('../views/RegisterView.vue')
    },
    {
      path: '/',
      name: 'home',
      component: () => import('../views/HomeView.vue')
    },
    {
      path: '/chat',
      name: 'chat',
      component: () => import('../views/ChatView.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/chat/history',
      name: 'chat-history',
      component: () => import('../views/ChatHistoryView.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/rag',
      name: 'rag',
      redirect: '/rag/documents'
    },
    {
      path: '/rag/documents',
      name: 'rag-documents',
      component: () => import('../views/RAGDocumentsView.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/rag/queries',
      name: 'rag-queries',
      component: () => import('../views/RAGQueriesView.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/prompts',
      name: 'prompts',
      component: () => import('../views/PromptsView.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/tools',
      name: 'tools',
      component: () => import('../views/ToolsView.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/logs',
      name: 'logs',
      component: () => import('../views/LogsView.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/monitor',
      name: 'monitor',
      component: () => import('../views/SystemMonitorView.vue'),
      meta: { requiresAuth: true }
    }
  ]
})

router.beforeEach((to, from, next) => {
  const authStore = useAuthStore()
  
  if (to.meta.requiresAuth && !authStore.isAuthenticated) {
    next('/login')
  } else if ((to.path === '/login' || to.path === '/register') && authStore.isAuthenticated) {
    next('/chat')
  } else {
    next()
  }
})

export default router
