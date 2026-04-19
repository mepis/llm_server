<template>
  <header class="header">
    <div class="header-content">
      <div class="header-logo">
        <h1>LLM Server</h1>
        <button v-if="isMobile" class="hamburger" @click="toggleMobileMenu" aria-label="Toggle menu">
          <i :class="mobileMenuOpen ? 'pi pi-times' : 'pi pi-bars'"></i>
        </button>
      </div>
      <div class="header-nav">
         <nav class="nav-links">
           <router-link to="/chat" class="nav-link">Chat</router-link>
           <router-link to="/rag" class="nav-link">RAG</router-link>
           <router-link to="/prompts" class="nav-link">Prompts</router-link>
           <router-link to="/tools" class="nav-link">Tools</router-link>
           <router-link to="/logs" class="nav-link">Logs</router-link>
           <router-link to="/monitor" class="nav-link">Monitor</router-link>
         </nav>
       </div>
      <div class="header-actions">
        <div class="user-info">
          <span class="username">{{ user?.username || 'User' }}</span>
          <span class="user-role" :class="`role-${user?.roles?.[0] || 'user'}`">{{ user?.roles?.[0] || 'user' }}</span>
        </div>
        <Button label="Logout" icon="pi pi-sign-out" @click="handleLogout" />
      </div>
    </div>
    <div v-if="mobileMenuOpen && isMobile" class="mobile-menu-overlay" @click="closeMobileMenu">
      <div class="mobile-menu" @click.stop>
        <nav class="mobile-nav-links">
          <router-link to="/chat" class="mobile-nav-link" @click="closeMobileMenu">Chat</router-link>
          <router-link to="/rag" class="mobile-nav-link" @click="closeMobileMenu">RAG</router-link>
          <router-link to="/prompts" class="mobile-nav-link" @click="closeMobileMenu">Prompts</router-link>
          <router-link to="/tools" class="mobile-nav-link" @click="closeMobileMenu">Tools</router-link>
          <router-link to="/logs" class="mobile-nav-link" @click="closeMobileMenu">Logs</router-link>
          <router-link to="/monitor" class="mobile-nav-link" @click="closeMobileMenu">Monitor</router-link>
        </nav>
        <div class="mobile-user-info">
          <span class="mobile-username">{{ user?.username || 'User' }}</span>
          <span class="mobile-user-role" :class="`role-${user?.roles?.[0] || 'user'}`">{{ user?.roles?.[0] || 'user' }}</span>
        </div>
        <Button label="Logout" icon="pi pi-sign-out" @click="handleLogout" class="mobile-logout-btn" />
      </div>
    </div>
  </header>
</template>

<script setup>
import { computed, ref } from 'vue'
import { useMediaQuery } from '@vueuse/core'
import { useAuthStore } from '@/stores/auth'
import Button from 'primevue/button'
import { useRouter } from 'vue-router'
import { useSidebar } from '@/composables/useSidebar'

const router = useRouter()
const authStore = useAuthStore()

const isMobile = useMediaQuery('(max-width: 768px)')
const mobileMenuOpen = ref(false)
const { toggleSidebar, sidebarOpen } = useSidebar()

const user = computed(() => authStore.user)

const toggleMobileMenu = () => {
  if (isMobile.value) {
    toggleSidebar()
  } else {
    mobileMenuOpen.value = !mobileMenuOpen.value
  }
}

const closeMobileMenu = () => {
  mobileMenuOpen.value = false
  if (isMobile.value) {
    sidebarOpen.value = false
  }
}

const handleLogout = () => {
  authStore.logout()
  closeMobileMenu()
  router.push('/login')
}
</script>

<style scoped>
.header {
  background: white;
  border-bottom: 1px solid #e5e7eb;
  padding: 1rem 2rem;
  position: sticky;
  top: 0;
  z-index: 100;
}

.header-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.header-logo {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.header-logo h1 {
  font-size: 1.5rem;
  color: #2d6a4f;
  margin: 0;
}

.hamburger {
  display: none;
  background: none;
  border: none;
  font-size: 1.5rem;
  color: #2d6a4f;
  cursor: pointer;
  padding: 0.5rem;
  border-radius: 6px;
  transition: background 0.2s;
}

.hamburger:hover {
  background: rgba(45, 106, 79, 0.1);
}

.header-nav {
  flex: 1;
  margin: 0 2rem;
}

.nav-links {
  display: flex;
  gap: 1.5rem;
}

.nav-link {
  color: #6b7280;
  text-decoration: none;
  padding: 0.5rem 1rem;
  border-radius: 6px;
  transition: all 0.2s;
}

.nav-link:hover,
.nav-link.router-link-active {
  color: #2d6a4f;
  background: rgba(45, 106, 79, 0.1);
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.user-info {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
}

.username {
  font-weight: 600;
  color: #374151;
  font-size: 0.9rem;
}

.user-role {
  font-size: 0.75rem;
  padding: 0.25rem 0.75rem;
  border-radius: 12px;
  font-weight: 600;
}

.role-user {
  background: #e0e7ff;
  color: #4338ca;
}

.role-admin {
  background: #fee2e2;
  color: #991b1b;
}

.role-system {
  background: #d1fae5;
  color: #059669;
}

.mobile-menu-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 99;
  display: flex;
  align-items: flex-start;
  justify-content: flex-end;
  animation: fadeIn 0.2s ease;
}

.mobile-menu {
  width: 100%;
  max-width: 300px;
  height: 100%;
  background: white;
  padding: 2rem 1.5rem;
  display: flex;
  flex-direction: column;
  animation: slideIn 0.3s ease;
}

.mobile-nav-links {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin-bottom: 2rem;
}

.mobile-nav-link {
  color: #6b7280;
  text-decoration: none;
  padding: 1rem;
  border-radius: 8px;
  font-size: 1.1rem;
  transition: all 0.2s;
}

.mobile-nav-link:hover,
.mobile-nav-link.router-link-active {
  color: #2d6a4f;
  background: rgba(45, 106, 79, 0.1);
}

.mobile-user-info {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  margin-bottom: 1.5rem;
  padding: 1rem;
  background: #f9fafb;
  border-radius: 8px;
}

.mobile-username {
  font-weight: 600;
  color: #374151;
  font-size: 1rem;
}

.mobile-user-role {
  font-size: 0.75rem;
  padding: 0.25rem 0.75rem;
  border-radius: 12px;
  font-weight: 600;
  margin-top: 0.5rem;
}

.mobile-logout-btn {
  margin-top: auto;
}

@media (max-width: 768px) {
  .header {
    padding: 0.75rem 1rem;
  }

  .header-logo h1 {
    font-size: 1.25rem;
  }

  .hamburger {
    display: block;
  }

  .header-nav {
    display: none;
  }

  .header-actions {
    gap: 0.5rem;
  }

  .user-info {
    display: none;
  }
}

@media (min-width: 769px) {
  .mobile-menu-overlay {
    display: none;
  }
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

@keyframes slideIn {
  from {
    transform: translateX(100%);
  }
  to {
    transform: translateX(0);
  }
}
</style>
