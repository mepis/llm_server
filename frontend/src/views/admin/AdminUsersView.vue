<template>
  <div class="admin-container">
    <div class="admin-header">
      <h1>User Management</h1>
      <p>Manage system users and their permissions</p>
    </div>
    <div class="admin-content">
      <div class="coming-soon">
        <i class="pi pi-lock"></i>
        <h2>User Management Coming Soon</h2>
        <p>This feature will allow administrators to manage user accounts, roles, and permissions.</p>
      </div>
    </div>
  </div>
</template>

<script setup>
</script>

<style scoped>
.admin-container {
  padding: 2rem;
  max-width: 1200px;
  margin: 0 auto;
}

.admin-header {
  margin-bottom: 2rem;
}

.admin-header h1 {
  font-size: 1.5rem;
  color: #1f2937;
  margin: 0 0 0.5rem 0;
}

.admin-header p {
  color: #6b7280;
  margin: 0;
}

.admin-content {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 400px;
}

.coming-soon {
  text-align: center;
  padding: 3rem;
  background: #f9fafb;
  border-radius: 12px;
  border: 1px solid #e5e7eb;
}

.coming-soon i {
  font-size: 3rem;
  color: #9ca3af;
  margin-bottom: 1rem;
}

.coming-soon h2 {
  font-size: 1.25rem;
  color: #374151;
  margin: 0 0 0.5rem 0;
}

.coming-soon p {
  color: #6b7280;
  margin: 0;
}
</style>
