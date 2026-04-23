<template>
  <div class="tool-call-card" :class="[stateClass]">
    <div class="card-trigger" @click="expanded = !expanded">
      <i :class="toolIcon" class="tool-icon"></i>
      <span class="tool-name">{{ displayName }}</span>
      <span v-if="isStreaming" class="tool-status streaming-status">
        <i class="pi pi-spin pi-spinner"></i> Running
      </span>
      <span v-else-if="state === 'error'" class="tool-status error-status">
        <i class="pi pi-times-circle"></i> Error
      </span>
      <span v-else class="tool-status completed-status">
        <i class="pi pi-check-circle"></i> Done
      </span>
      <i :class="['pi', expanded ? 'pi-chevron-up' : 'pi-chevron-down']" class="expand-arrow"></i>
    </div>
    <Transition name="slide">
      <div v-show="expanded" class="card-body">
        <div v-if="renderedContent" class="tool-content">
          <pre class="tool-output">{{ renderedContent }}</pre>
        </div>
        <div v-else class="tool-content-empty">
          <span class="pi pi-cog"></span>
          <span>No arguments</span>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'

const expanded = ref(false)

const props = defineProps({
  toolCall: { type: Object, required: true },
  isStreaming: { type: Boolean, default: false },
})

const state = computed(() => {
  if (props.isStreaming) return 'running'
  return 'completed'
})

const stateClass = computed(() => {
  if (props.isStreaming) return 'tool-running'
  return 'tool-completed'
})

const toolName = computed(() => {
  return props.toolCall?.function?.name || props.toolCall?.tool_name || 'unknown'
})

const displayName = computed(() => {
  const name = toolName.value
  const statusMap = {
    read: 'Reading',
    write: 'Writing',
    edit: 'Editing',
    bash: 'Running',
    glob: 'Searching',
    grep: 'Grep',
    question: 'Asking',
    todo: 'Updating',
    skill: 'Using',
  }
  return statusMap[name] ? `${statusMap[name]} ${name}` : name
})

const toolIcon = computed(() => {
  const iconMap = {
    read: 'pi pi-book',
    write: 'pi pi-pencil',
    edit: 'pi pi-clone',
    bash: 'pi pi-command',
    glob: 'pi pi-search',
    grep: 'pi pi-filter',
    question: 'pi pi-question',
    todo: 'pi pi-check-square',
    skill: 'pi pi-star',
    webfetch: 'pi pi-globe',
    websearch: 'pi pi-world',
    task: 'pi pi-robot',
  }
  return iconMap[toolName.value] || 'pi pi-cog'
})

const renderedContent = computed(() => {
  const args = props.toolCall?.function?.arguments
  if (!args) return null
  try {
    const parsed = JSON.parse(args)
    return typeof parsed === 'object' ? JSON.stringify(parsed, null, 2) : String(parsed)
  } catch {
    return args
  }
})
</script>

<style scoped>
.tool-call-card {
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
  background: #f0fdf4;
}

.tool-call-card.tool-running .card-trigger:hover {
  background: #fef3c7;
}

.tool-icon {
  font-size: 0.875rem;
}

.tool-name {
  font-size: 0.8125rem;
  font-weight: 600;
  color: #374151;
}

.tool-status {
  margin-left: auto;
  font-size: 0.75rem;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 0.25rem;
}

.streaming-status { color: #d97706; }
.error-status { color: #dc2626; }
.completed-status { color: #16a34a; }

.expand-arrow {
  margin-left: auto;
  font-size: 0.75rem;
  color: #9ca3af;
  transition: transform 0.2s ease;
}

.card-body {
  padding: 0 0.75rem 0.75rem 1.5rem;
}

.tool-content {
  margin-top: 0.25rem;
}

.tool-output {
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  padding: 0.625rem;
  margin: 0;
  font-size: 0.75rem;
  overflow-x: auto;
  color: #374151;
  white-space: pre-wrap;
  word-break: break-word;
}

.tool-content-empty {
  display: flex;
  align-items: center;
  gap: 0.35rem;
  padding: 0.25rem 0 0.5rem;
  font-size: 0.75rem;
  color: #9ca3af;
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
