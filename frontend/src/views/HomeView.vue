<template>
  <div class="app-container">
    <Header />
    <Sidebar />
    <main class="main-content">
      <router-view />
    </main>
  </div>
</template>

<script setup>
import Header from '../components/layout/Header.vue'
import Sidebar from '../components/components/layout/Sidebar.vue'
</script>

<style scoped>
.app-container {
  display: flex;
  min-height: 100vh;
}

.main-content {
  flex: 1;
  padding: 2rem;
  background: #f3f4f6;
  margin-left: 250px;
}
</style>
