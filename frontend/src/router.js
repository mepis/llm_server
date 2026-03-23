import { createRouter, createWebHistory } from 'vue-router';
import ScriptsView from '../views/ScriptsView.vue';
import ServicesView from '../views/ServicesView.vue';
import ModelsView from '../views/ModelsView.vue';
import DownloadView from '../views/DownloadView.vue';

const routes = [
  {
    path: '/',
    name: 'Scripts',
    component: ScriptsView
  },
  {
    path: '/services',
    name: 'Services',
    component: ServicesView
  },
  {
    path: '/models',
    name: 'Models',
    component: ModelsView
  },
  {
    path: '/downloads',
    name: 'Downloads',
    component: DownloadView
  }
];

const router = createRouter({
  history: createWebHistory(),
  routes
});

export default router;
