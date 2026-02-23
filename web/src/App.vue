<script setup>
import { ref } from 'vue';
import { useRoute } from 'vue-router';

const route = useRoute();

const navigationItems = [
  { name: 'Dashboard', path: '/', icon: '📊' },
  { name: 'Build', path: '/build', icon: '🔨' },
  { name: 'Services', path: '/services', icon: '⚙️' },
  { name: 'Models', path: '/models', icon: '🤖' },
  { name: 'Documentation', path: '/docs', icon: '📚' }
];

const sidebarCollapsed = ref(false);

function toggleSidebar() {
  sidebarCollapsed.value = !sidebarCollapsed.value;
}
</script>

<template>
  <div class="app-container">
    <!-- Sidebar -->
    <aside class="sidebar" :class="{ collapsed: sidebarCollapsed }">
      <div class="sidebar-header">
        <h1 v-if="!sidebarCollapsed">LLM Server</h1>
        <h1 v-else>LLM</h1>
      </div>

      <nav class="sidebar-nav">
        <router-link
          v-for="item in navigationItems"
          :key="item.path"
          :to="item.path"
          class="nav-item"
          :class="{ active: route.path === item.path }"
        >
          <span class="nav-icon">{{ item.icon }}</span>
          <span v-if="!sidebarCollapsed" class="nav-label">{{ item.name }}</span>
        </router-link>
      </nav>

      <button class="sidebar-toggle" @click="toggleSidebar">
        {{ sidebarCollapsed ? '→' : '←' }}
      </button>
    </aside>

    <!-- Main Content -->
    <main class="main-content">
      <router-view />
    </main>
  </div>
</template>

<style>
/* Global Styles */
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
  background: #f8fffe;
  color: #2c3e50;
}

#app {
  height: 100vh;
  overflow: hidden;
}

.app-container {
  display: flex;
  height: 100vh;
}

/* Sidebar Styles */
.sidebar {
  width: 250px;
  background: linear-gradient(180deg, #d4f4ed 0%, #b8f0e6 100%);
  border-right: 2px solid #a0e7d8;
  display: flex;
  flex-direction: column;
  transition: width 0.3s ease;
  position: relative;
}

.sidebar.collapsed {
  width: 80px;
}

.sidebar-header {
  padding: 2rem 1.5rem;
  border-bottom: 2px solid #a0e7d8;
  background: rgba(255, 255, 255, 0.3);
}

.sidebar-header h1 {
  font-size: 1.5rem;
  color: #2c3e50;
  font-weight: 600;
  white-space: nowrap;
  overflow: hidden;
}

.sidebar-nav {
  flex: 1;
  padding: 1rem 0;
  overflow-y: auto;
}

.nav-item {
  display: flex;
  align-items: center;
  padding: 1rem 1.5rem;
  color: #2c3e50;
  text-decoration: none;
  transition: all 0.2s ease;
  border-left: 4px solid transparent;
  gap: 1rem;
}

.nav-item:hover {
  background: rgba(255, 255, 255, 0.5);
  border-left-color: #5dd4bf;
}

.nav-item.active {
  background: rgba(255, 255, 255, 0.7);
  border-left-color: #2dd4bf;
  font-weight: 600;
}

.nav-icon {
  font-size: 1.5rem;
  min-width: 1.5rem;
  text-align: center;
}

.nav-label {
  white-space: nowrap;
  overflow: hidden;
}

.sidebar-toggle {
  padding: 1rem;
  background: rgba(255, 255, 255, 0.3);
  border: none;
  border-top: 2px solid #a0e7d8;
  cursor: pointer;
  color: #2c3e50;
  font-size: 1.2rem;
  transition: background 0.2s ease;
}

.sidebar-toggle:hover {
  background: rgba(255, 255, 255, 0.5);
}

/* Main Content */
.main-content {
  flex: 1;
  overflow-y: auto;
  background: #ffffff;
}

/* Utility Classes */
.card {
  background: #ffffff;
  border: 2px solid #e5e7eb;
  border-radius: 8px;
  padding: 1.5rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.card:hover {
  border-color: #a0e7d8;
}

.btn {
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 6px;
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.2s ease;
  font-weight: 500;
}

.btn-primary {
  background: linear-gradient(135deg, #5dd4bf 0%, #2dd4bf 100%);
  color: white;
}

.btn-primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(45, 212, 191, 0.3);
}

.btn-secondary {
  background: #f3f4f6;
  color: #2c3e50;
  border: 2px solid #e5e7eb;
}

.btn-secondary:hover {
  background: #e5e7eb;
}

.badge {
  display: inline-block;
  padding: 0.25rem 0.75rem;
  border-radius: 12px;
  font-size: 0.875rem;
  font-weight: 600;
}

.badge-success {
  background: #d4f4ed;
  color: #0f766e;
}

.badge-error {
  background: #fee2e2;
  color: #991b1b;
}

.badge-warning {
  background: #fef3c7;
  color: #92400e;
}

.badge-info {
  background: #dbeafe;
  color: #1e40af;
}
</style>
