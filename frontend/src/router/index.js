import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import Layout from '../components/layout/Layout.vue'

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
      component: () => import('../views/home/HomeView.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/',
      component: Layout,
      meta: { requiresAuth: true },
      children: [
        {
          path: 'chat',
          name: 'chat',
          component: () => import('../views/chat/ChatView.vue')
        },
        {
          path: 'chat/history',
          name: 'chat-history',
          component: () => import('../views/chat/ChatHistoryView.vue')
        },
        {
          path: 'rag',
          redirect: '/rag/documents'
        },
        {
          path: 'rag/documents',
          name: 'rag-documents',
          component: () => import('../views/rag/RAGDocumentsView.vue')
        },
        {
          path: 'rag/queries',
          name: 'rag-queries',
          component: () => import('../views/rag/RAGQueriesView.vue')
        },
        {
          path: 'prompts',
          name: 'prompts',
          component: () => import('../views/prompts/PromptsView.vue')
        },
        {
          path: 'tools',
          name: 'tools',
          component: () => import('../views/tools/ToolsView.vue')
        },
        {
          path: 'skills',
          name: 'skills',
          component: () => import('../views/skills/SkillsView.vue')
        },
        {
          path: 'logs',
          name: 'logs',
          component: () => import('../views/logs/LogsView.vue')
        },
        {
          path: 'monitor',
          name: 'monitor',
          component: () => import('../views/monitor/SystemMonitorView.vue')
        },
        {
          path: 'debug',
          name: 'debug',
          component: () => import('../views/debug/DebugView.vue')
        },
        {
          path: 'admin/users',
          name: 'admin-users',
          component: () => import('../views/admin/AdminUsersView.vue'),
          meta: { requiresAdmin: true }
        },
        {
          path: 'admin/settings',
          name: 'admin-settings',
          component: () => import('../views/admin/AdminSettingsView.vue'),
          meta: { requiresAdmin: true }
        }
      ]
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
