<template>
  <div class="tool-result-card">
    <div class="card-trigger" @click="expanded = !expanded">
      <i class="pi pi-check-circle result-icon"></i>
      <span class="result-title">Tool Result</span>
      <span v-if="toolCallId" class="result-id">{{ toolCallId }}</span>
      <i :class="['pi', expanded ? 'pi-chevron-up' : 'pi-chevron-down']" class="expand-arrow"></i>
    </div>
    <Transition name="slide">
      <div v-show="expanded" class="card-body">
        <pre>{{ content }}</pre>
      </div>
    </Transition>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const expanded = ref(false)

defineProps({
  content: { type: String, default: '' },
  toolCallId: { type: String, default: '' },
})
</script>

<style scoped>
.tool-result-card {
  margin-top: 0.5rem;
  border-radius: 8px;
  overflow: hidden;
}

.card-trigger {
  display: flex;
  align-items: center;
  gap: 0.35rem;
  padding: 0.625rem 0.75rem;
  cursor: pointer;
  border-radius: 8px;
  transition: background 0.15s ease;
}

.card-trigger:hover {
  background: #fffbeb;
}

.result-icon {
  font-size: 0.875rem;
  color: #92400e;
}

.result-title {
  font-size: 0.8125rem;
  font-weight: 600;
  color: #92400e;
}

.result-id {
  margin-left: auto;
  font-size: 0.6875rem;
  color: #d1d5db;
  font-family: monospace;
}

.expand-arrow {
  margin-left: auto;
  font-size: 0.75rem;
  color: #9ca3af;
  transition: transform 0.2s ease;
}

.card-body {
  padding: 0 0.75rem 0.75rem 1.5rem;
}

.card-body pre {
  background: #fffbeb;
  border: 1px solid #fde68a;
  border-radius: 6px;
  padding: 0.625rem;
  margin: 0;
  font-size: 0.8rem;
  white-space: pre-wrap;
  word-break: break-word;
  color: #374151;
}

.slide-enter-active,
.slide-leave-active {
  transition: all 0.2s ease;
  overflow: hidden;
}

.slide-enter-from,
.slide-leave-to {
  opacity: 0;
  transform: translateY(-4px);
  max-height: 0;
}

.slide-enter-to,
.slide-leave-from {
  opacity: 1;
  max-height: 500px;
}
</style>
