<template>
  <aside class="sidebar">
    <div class="sidebar-content">
      <div class="sidebar-section">
        <h3 class="section-title">Chat</h3>
        <nav class="nav-links">
          <router-link to="/chat" class="nav-link">
            <i class="pi pi-comments"></i>
            <span>New Chat</span>
          </router-link>
          <router-link to="/chat/history" class="nav-link">
            <i class="pi pi-history"></i>
            <span>History</span>
          </router-link>
        </nav>
      </div>
      <div class="sidebar-section">
        <h3 class="section-title">Knowledge</h3>
        <nav class="nav-links">
          <router-link to="/rag/documents" class="nav-link">
            <i class="pi pi-file"></i>
            <span>Documents</span>
          </router-link>
          <router-link to="/rag/queries" class="nav-link">
            <i class="pi pi-search"></i>
            <span>Queries</span>
          </router-link>
        </nav>
      </div>
      <div class="sidebar-section">
         <h3 class="section-title">Management</h3>
         <nav class="nav-links">
           <router-link to="/prompts" class="nav-link">
             <i class="pi pi-font"></i>
             <span>Prompts</span>
           </router-link>
           <router-link to="/tools" class="nav-link">
             <i class="pi pi-wrench"></i>
             <span>Tools</span>
           </router-link>
           <router-link to="/logs" class="nav-link">
             <i class="pi pi-list"></i>
             <span>Logs</span>
           </router-link>
           <router-link to="/monitor" class="nav-link">
             <i class="pi pi-chart-bar"></i>
             <span>Monitor</span>
           </router-link>
         </nav>
       </div>
      <div v-if="user?.role === 'admin' || user?.role === 'system'" class="sidebar-section">
        <h3 class="section-title">Admin</h3>
        <nav class="nav-links">
          <router-link to="/admin/users" class="nav-link">
            <i class="pi pi-users"></i>
            <span>Users</span>
          </router-link>
          <router-link to="/admin/settings" class="nav-link">
            <i class="pi pi-cog"></i>
            <span>Settings</span>
          </router-link>
        </nav>
      </div>
    </div>
  </aside>
</template>

<script setup>
import { computed } from 'vue'
import { useAuthStore } from '@/stores/auth'

const authStore = useAuthStore()

const user = computed(() => authStore.user)
</script>

<style scoped>
.sidebar {
  width: 250px;
  background: white;
  border-right: 1px solid #e5e7eb;
  position: fixed;
  height: 100vh;
  overflow-y: auto;
}

.sidebar-content {
  padding: 1.5rem 1rem;
}

.sidebar-section {
  margin-bottom: 2rem;
}

.section-title {
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: #9ca3af;
  margin-bottom: 1rem;
  font-weight: 700;
}

.nav-links {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.nav-link {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  color: #6b7280;
  text-decoration: none;
  padding: 0.75rem 1rem;
  border-radius: 6px;
  transition: all 0.2s;
  font-size: 0.9rem;
}

.nav-link:hover,
.nav-link.router-link-active {
  background: rgba(45, 106, 79, 0.1);
  color: #2d6a4f;
}

.nav-link i {
  font-size: 1.1rem;
}
</style>
