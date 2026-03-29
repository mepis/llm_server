<template>
  <div class="category-section">
    <div class="category-header" @click="collapsed = !collapsed">
      <span class="category-title">{{ title }}</span>
      <span>{{ collapsed ? '▶' : '▼' }}</span>
    </div>
    <div v-show="!collapsed" class="category-content">
      <slot />
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'

defineProps({
  title: String
})

defineEmits(['toggle'])

const collapsed = ref(false)
</script>
