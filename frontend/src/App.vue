<template>
  <div id="app">
    <nav class="nav">
      <router-link to="/">Scripts</router-link>
      <router-link to="/services">Services</router-link>
      <router-link to="/models">Models</router-link>
      <router-link to="/downloads">Downloads</router-link>
    </nav>
    <router-view />
  </div>
</template>

<script setup>
</script>

<style scoped>
#app {
  min-height: 100vh;
}

.nav {
  display: flex;
  gap: 1rem;
  padding: 1rem 2rem;
  background-color: #1a1a1a;
}

.nav a {
  text-decoration: none;
  color: #9ca3af;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  transition: all 0.2s;
}

.nav a:hover,
.nav a.router-link-active {
  background-color: #374151;
  color: white;
}
</style>
