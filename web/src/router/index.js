import { createRouter, createWebHistory } from 'vue-router';

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      name: 'Dashboard',
      component: () => import('../views/Dashboard.vue')
    },
    {
      path: '/build',
      name: 'Build',
      component: () => import('../views/Build.vue')
    },
    {
      path: '/services',
      name: 'Services',
      component: () => import('../views/Services.vue')
    },
    {
      path: '/models',
      name: 'Models',
      component: () => import('../views/Models.vue')
    },
    {
      path: '/docs',
      name: 'Documentation',
      component: () => import('../views/Documentation.vue')
    }
  ]
});

export default router;
