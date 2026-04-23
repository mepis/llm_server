<template>
  <div class="message-bubble" :class="[role, { streaming: isStreaming }]">
    <div class="message-avatar">
      <span v-if="role === 'user'">U</span>
      <span v-else-if="role === 'tool'">T</span>
      <span v-else><i class="pi pi-robot"></i></span>
    </div>
    <div class="message-content">
      <div class="message-role">{{ roleLabel }}</div>
      <slot />
      <div class="message-time">{{ formattedTime }}</div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  role: { type: String, required: true },
  timestamp: { type: String, default: '' },
  isStreaming: { type: Boolean, default: false },
})

const roleLabel = computed(() => {
  if (props.role === 'user') return props.role || 'User'
  if (props.role === 'tool') return 'Tool Result'
  return 'Assistant'
})

const formattedTime = computed(() => {
  if (!props.timestamp) return ''
  const date = new Date(props.timestamp)
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
})
</script>

<style scoped>
.message-bubble {
  display: flex;
  gap: 0.75rem;
  padding: 1rem;
  margin-bottom: 0.75rem;
  background: white;
  border-radius: 8px;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
  transition: box-shadow 0.2s ease;
}

.message-bubble:hover {
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.08);
}

.message-bubble.user {
  flex-direction: row-reverse;
}

.message-avatar {
  width: 36px;
  height: 36px;
  min-width: 36px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 0.8125rem;
}

.message-bubble.user .message-avatar {
  background: #2d6a4f;
  color: white;
}

.message-bubble.assistant .message-avatar {
  background: #e5e7eb;
  color: #374151;
}

.message-bubble.tool .message-avatar {
  background: #fef3c7;
  color: #92400e;
}

.message-content {
  flex: 1;
  max-width: 640px;
}

.message-role {
  font-size: 0.6875rem;
  font-weight: 600;
  color: #9ca3af;
  text-transform: uppercase;
  letter-spacing: 0.025em;
  margin-bottom: 0.35rem;
}

.message-time {
  font-size: 0.6875rem;
  color: #d1d5db;
  margin-top: 0.5rem;
}

.streaming .message-content {
  position: relative;
}
</style>
