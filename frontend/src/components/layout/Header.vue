<template>
  <header class="header">
    <div class="header-content">
      <div class="header-logo">
        <h1>LLM Server</h1>
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
          <span class="user-role" :class="`role-${user?.role || 'user'}`">{{ user?.role || 'user' }}</span>
        </div>
        <Button label="Logout" icon="pi pi-sign-out" @click="handleLogout" />
      </div>
    </div>
  </header>
</template>

<script setup>
import { computed } from 'vue'
import { useAuthStore } from '@/stores/auth'
import Button from 'primevue/button'
import { useRouter } from 'vue-router'

const router = useRouter()
const authStore = useAuthStore()

const user = computed(() => authStore.user)

const handleLogout = () => {
  authStore.logout()
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

.header-logo h1 {
  font-size: 1.5rem;
  color: #2d6a4f;
  margin: 0;
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
</style>
