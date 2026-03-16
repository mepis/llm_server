import { createRouter, createWebHistory } from 'vue-router'
import HelloWorld from './components/HelloWorld.vue'
import About from './components/About.vue'
import Login from './components/Login.vue'

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
  },
  {
    path: '/login',
    component: Login,
    name: 'Login'
  }
]

export default createRouter({
  history: createWebHistory(),
  routes
})