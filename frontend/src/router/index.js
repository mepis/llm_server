import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/login',
      name: 'login',
      component: () => import('../views/auth/LoginView.vue')
    },
    {
      path: '/register',
      name: 'register',
      component: () => import('../views/auth/RegisterView.vue')
    },
    {
      path: '/',
      name: 'home',
      component: () => import('../views/home/HomeView.vue')
    },
    {
      path: '/chat',
      name: 'chat',
      component: () => import('../views/chat/ChatView.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/chat/history',
      name: 'chat-history',
      component: () => import('../views/chat/ChatHistoryView.vue'),
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
      component: () => import('../views/rag/RAGDocumentsView.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/rag/queries',
      name: 'rag-queries',
      component: () => import('../views/rag/RAGQueriesView.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/prompts',
      name: 'prompts',
      component: () => import('../views/prompts/PromptsView.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/tools',
      name: 'tools',
      component: () => import('../views/tools/ToolsView.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/logs',
      name: 'logs',
      component: () => import('../views/logs/LogsView.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/monitor',
      name: 'monitor',
      component: () => import('../views/monitor/SystemMonitorView.vue'),
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
