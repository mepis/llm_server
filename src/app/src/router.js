import { createRouter, createWebHistory } from 'vue-router'
import HelloWorld from './components/HelloWorld.vue'
import About from './components/About.vue'

const routes = [
  {
    path: '/',
    component: HelloWorld,
    name: 'Home'
  },
  {
    path: '/about',
    component: About,
    name: 'About'
  }
]

export default createRouter({
  history: createWebHistory(),
  routes
})