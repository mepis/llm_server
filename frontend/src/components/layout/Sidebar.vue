<template>
  <aside :class="['sidebar', { 'sidebar-open': sidebarOpen }]">
    <div v-if="isMobile" class="sidebar-header">
      <h2>Menu</h2>
      <button class="sidebar-close" @click="closeSidebar" aria-label="Close menu">
        <i class="pi pi-times"></i>
      </button>
    </div>
    <div class="sidebar-content">
      <div class="sidebar-section">
        <h3 class="section-title">Chat</h3>
        <nav class="nav-links">
          <router-link to="/chat" class="nav-link" @click="closeAfterNav">
            <i class="pi pi-comments"></i>
            <span>New Chat</span>
          </router-link>
          <router-link to="/chat/history" class="nav-link" @click="closeAfterNav">
            <i class="pi pi-history"></i>
            <span>History</span>
          </router-link>
        </nav>
      </div>
      <div class="sidebar-section">
        <h3 class="section-title">Knowledge</h3>
        <nav class="nav-links">
          <router-link to="/rag/documents" class="nav-link" @click="closeAfterNav">
            <i class="pi pi-file"></i>
            <span>Documents</span>
          </router-link>
          <router-link to="/rag/queries" class="nav-link" @click="closeAfterNav">
            <i class="pi pi-search"></i>
            <span>Queries</span>
          </router-link>
        </nav>
      </div>
      <div class="sidebar-section">
         <h3 class="section-title">Management</h3>
         <nav class="nav-links">
          <router-link to="/prompts" class="nav-link" @click="closeAfterNav">
              <i class="pi pi-font"></i>
              <span>Prompts</span>
            </router-link>
           <router-link v-if="user?.roles?.[0] === 'admin' || user?.roles?.[0] === 'system'" to="/tools" class="nav-link" @click="closeAfterNav">
              <i class="pi pi-wrench"></i>
              <span>Tools</span>
            </router-link>
            <router-link to="/skills" class="nav-link" @click="closeAfterNav">
              <i class="pi pi-book"></i>
              <span>Skills</span>
            </router-link>
            <router-link v-if="user?.roles?.[0] === 'admin' || user?.roles?.[0] === 'system'" to="/logs" class="nav-link" @click="closeAfterNav">
              <i class="pi pi-list"></i>
              <span>Logs</span>
            </router-link>
          <router-link v-if="user?.roles?.[0] === 'admin' || user?.roles?.[0] === 'system'" to="/monitor" class="nav-link" @click="closeAfterNav">
              <i class="pi pi-chart-bar"></i>
              <span>Monitor</span>
            </router-link>
          </nav>
        </div>
      <div v-if="user?.roles?.[0] === 'admin' || user?.roles?.[0] === 'system'" class="sidebar-section">
        <h3 class="section-title">Admin</h3>
        <nav class="nav-links">
          <router-link to="/admin/users" class="nav-link" @click="closeAfterNav">
            <i class="pi pi-users"></i>
            <span>Users</span>
          </router-link>
          <router-link to="/admin/settings" class="nav-link" @click="closeAfterNav">
            <i class="pi pi-cog"></i>
            <span>Settings</span>
          </router-link>
        </nav>
      </div>
    </div>
    <div class="sidebar-footer">
      <div class="user-info">
        <span class="username">{{ user?.username || 'User' }}</span>
      </div>
      <Button label="Logout" icon="pi pi-sign-out" @click="handleLogout" />
    </div>
  </aside>
  <div v-if="isMobile && sidebarOpen" class="sidebar-backdrop" @click="closeSidebar"></div>
</template>

<script setup>
import { computed } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useSidebar } from '@/composables/useSidebar'
import Button from 'primevue/button'
import { useRouter } from 'vue-router'

const router = useRouter()
const authStore = useAuthStore()
const { isMobile, sidebarOpen, closeSidebar } = useSidebar()

const user = computed(() => authStore.user)

const closeAfterNav = () => {
  if (isMobile.value) {
    closeSidebar()
  }
}

const handleLogout = () => {
  authStore.logout()
  router.push('/login')
}
</script>

<style scoped>
.sidebar {
  width: 250px;
  background: white;
  border-right: 1px solid #e5e7eb;
  position: fixed;
  left: 0;
  top: 0;
  height: 100vh;
  overflow-y: auto;
  z-index: 1000;
  transition: transform 0.3s ease;
}

.sidebar-header {
  display: none;
  padding: 1rem 1.5rem;
  border-bottom: 1px solid #e5e7eb;
  align-items: center;
  justify-content: space-between;
}

.sidebar-header h2 {
  font-size: 1.25rem;
  color: #2d6a4f;
  margin: 0;
}

.sidebar-close {
  display: none;
  background: none;
  border: none;
  font-size: 1.5rem;
  color: #6b7280;
  cursor: pointer;
  padding: 0.5rem;
  border-radius: 6px;
  transition: background 0.2s;
}

.sidebar-close:hover {
  background: #f3f4f6;
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

.sidebar-backdrop {
  display: none;
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 999;
}

.sidebar-footer {
  padding: 1rem;
  border-top: 1px solid #e5e7eb;
  margin-top: auto;
}

.user-info {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  margin-bottom: 0.75rem;
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
  margin-top: 0.25rem;
}

.role-admin {
  background: #fee2e2;
  color: #991b1b;
}

.role-system {
  background: #d1fae5;
  color: #059669;
}

@media (max-width: 768px) {
  .sidebar {
    transform: translateX(-100%);
    box-shadow: 2px 0 8px rgba(0, 0, 0, 0.2);
  }

  .sidebar.sidebar-open {
    transform: translateX(0);
  }

  .sidebar-header {
    display: flex;
  }

  .sidebar-close {
    display: block;
  }

  .sidebar-backdrop {
    display: block;
  }
}
</style>
