<template>
  <div class="thinking-indicator">
    <span class="thinking-label">
      <i class="pi pi-brain"></i>
      <span class="thinking-text">{{ label }}</span>
      <span class="shimmer-dot" :class="{ active: dots.length > 0 }">{{ dots[0] || '' }}</span>
      <span class="shimmer-dot" :class="{ active: dots.length > 1 }">{{ dots[1] || '' }}</span>
      <span class="shimmer-dot" :class="{ active: dots.length > 2 }">{{ dots[2] || '' }}</span>
    </span>
    <slot />
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'

const props = defineProps({
  label: { type: String, default: 'Thinking' },
})

const dots = ref([])
let interval = null

onMounted(() => {
  let count = 0
  interval = setInterval(() => {
    const n = count % 4
    if (n === 0) dots.value = []
    else if (n === 1) dots.value = ['.']
    else if (n === 2) dots.value = ['.', '.']
    else dots.value = ['.', '.', '.']
    count++
  }, 400)
})

onBeforeUnmount(() => {
  clearInterval(interval)
})
</script>

<style scoped>
.thinking-indicator {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 0;
}

.thinking-label {
  display: flex;
  align-items: center;
  gap: 0.35rem;
  font-size: 0.8125rem;
  color: #9ca3af;
  font-style: italic;
}

.thinking-label i {
  font-size: 0.75rem;
}

.shimmer-dot {
  display: inline-block;
  width: 0.35rem;
  height: 0.35rem;
  border-radius: 50%;
  background: #9ca3af;
  opacity: 0.25;
  transition: opacity 0.2s ease, transform 0.2s ease;
}

.shimmer-dot.active {
  opacity: 1;
  transform: scale(1.2);
}

.thinking-text {
  animation: shimmer 1.5s ease-in-out infinite;
}

@keyframes shimmer {
  0%, 100% { opacity: 0.5; }
  50% { opacity: 1; }
}
</style>
