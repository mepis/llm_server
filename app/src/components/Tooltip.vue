<template>
  <div class="tooltip">
    <span class="tooltip-icon">?</span>
    <div class="tooltip-content">
      <div v-if="title" class="tooltip-title">{{ title }}</div>
      <div v-if="description" class="tooltip-section">
        <span class="tooltip-label">Description:</span>
        <p>{{ description }}</p>
      </div>
      <div v-if="recommended" class="tooltip-section">
        <span class="tooltip-label">Recommended:</span>
        <p>{{ recommended }}</p>
      </div>
      <div v-if="example" class="tooltip-section">
        <span class="tooltip-label">Example:</span>
        <p>{{ example }}</p>
      </div>
    </div>
  </div>
</template>

<script setup>
defineProps({
  title: String,
  description: String,
  recommended: String,
  example: String
})
</script>
