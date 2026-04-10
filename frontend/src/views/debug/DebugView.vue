<template>
  <div class="debug-view">
    <h1>Console Debug</h1>
    
    <div class="debug-filters">
      <Dropdown
        v-model="debugStore.filterLevel"
        :options="filterOptions"
        option-label="label"
        option-value="value"
        placeholder="All levels"
        class="filter-dropdown"
      />
      <InputText
        v-model="debugStore.searchText"
        placeholder="Search messages..."
        class="search-input"
        icon-search
      />
      <Button 
        label="Clear" 
        icon="pi pi-trash" 
        severity="secondary"
        @click="debugStore.clear"
        class="clear-btn"
      />
      <Button 
        label="Auto-scroll" 
        icon="pi pi-arrow-down" 
        severity="secondary"
        @click="autoScroll = !autoScroll"
        :outlined="!autoScroll"
        class="autoscroll-btn"
      />
    </div>

    <div class="debug-stats">
      <span class="stat-item">
        <i class="pi pi-info-circle" style="color: #3b82f6"></i>
        {{ debugStore.infoCount || 0 }}
      </span>
      <span class="stat-item">
        <i class="pi pi-exclamation-circle" style="color: #f59e0b"></i>
        {{ debugStore.warnCount }}
      </span>
      <span class="stat-item">
        <i class="pi pi-exclamation-triangle" style="color: #ef4444"></i>
        {{ debugStore.errorCount }}
      </span>
      <span class="stat-divider">|</span>
      <span class="stat-item">{{ debugStore.messageCount }} total</span>
      <span class="stat-divider">|</span>
      <span class="stat-item">{{ debugStore.filteredMessages.length }} shown</span>
    </div>

    <div class="debug-messages" ref="messagesContainer">
      <div
        v-for="msg in debugStore.filteredMessages"
        :key="msg.id"
        class="debug-message"
        :class="'debug-message-' + msg.level"
      >
        <div class="message-header" @click="msg.expanded = !msg.expanded">
          <span class="message-level" :class="'level-' + msg.level">
            {{ msg.level.toUpperCase() }}
          </span>
          <span class="message-time">
            {{ formatTime(msg.timestamp) }}
          </span>
          <span class="message-preview">
            {{ msg.fullMessage.substring(0, 80) }}{{ msg.fullMessage.length > 80 ? '...' : '' }}
          </span>
          <Button
            icon="pi pi-copy"
            severity="secondary"
            text
            class="copy-btn"
            @click.stop="copyToClipboard(msg)"
            :aria-label="'Copy message to clipboard'"
          />
          <i class="pi" :class="msg.expanded ? 'pi-chevron-up' : 'pi-chevron-down'"></i>
        </div>
        <div class="message-content">
          <pre class="message-text">{{ msg.fullMessage }}</pre>
          <div v-if="msg.stack" class="stack-section">
            <span class="stack-label">Error Stack:</span>
            <pre class="message-stack">{{ msg.stack }}</pre>
          </div>
          <div v-if="msg.trace && (!msg.stack || msg.trace !== msg.stack)" class="stack-section">
            <span class="stack-label">Call Trace:</span>
            <pre class="message-trace">{{ msg.trace }}</pre>
          </div>
        </div>
      </div>

      <div v-if="debugStore.filteredMessages.length === 0" class="no-messages">
        <i class="pi pi-inbox"></i>
        <p>No messages found</p>
      </div>
    </div>
    
    <Toast ref="toast" />
  </div>
</template>

<script setup>
import { ref, computed, watch, nextTick } from 'vue'
import { useDebugStore } from '@/stores/debug'
import Dropdown from 'primevue/dropdown'
import Button from 'primevue/button'
import InputText from 'primevue/inputtext'
import Toast from 'primevue/toast'

const debugStore = useDebugStore()
const messagesContainer = ref(null)
const autoScroll = ref(true)
const toast = ref(null)

const filterOptions = [
  { label: 'All Levels', value: 'all' },
  { label: 'Errors', value: 'error' },
  { label: 'Warnings', value: 'warn' },
  { label: 'Info', value: 'info' },
  { label: 'Logs', value: 'log' },
  { label: 'Debug', value: 'debug' }
]

const formatTime = (timestamp) => {
  const date = new Date(timestamp)
  return date.toLocaleTimeString('en-US', { 
    hour12: false,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    fractionalSecondDigits: 3
  })
}

const scrollToBottom = () => {
  if (messagesContainer.value && autoScroll.value) {
    messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
  }
}

const copyToClipboard = async (msg) => {
  const content = []
  content.push(`[${msg.level.toUpperCase()}] ${msg.fullMessage}`)
  if (msg.stack) {
    content.push(`\nError Stack:\n${msg.stack}`)
  }
  if (msg.trace && (!msg.stack || msg.trace !== msg.stack)) {
    content.push(`\nCall Trace:\n${msg.trace}`)
  }
  
  try {
    await navigator.clipboard.writeText(content.join('\n'))
    toast.value?.add({
      severity: 'success',
      summary: 'Copied',
      detail: 'Message copied to clipboard',
      life: 2000
    })
  } catch (err) {
    toast.value?.add({
      severity: 'error',
      summary: 'Failed',
      detail: 'Failed to copy to clipboard',
      life: 3000
    })
  }
}

watch(
  () => debugStore.filteredMessages,
  () => {
    nextTick(() => {
      scrollToBottom()
    })
  },
  { deep: true }
)
</script>

<style scoped>
.debug-view {
  padding: 1.5rem;
  background: #f9fafb;
  min-height: 100%;
}

.debug-view h1 {
  font-size: 1.5rem;
  font-weight: 600;
  color: #374151;
  margin-bottom: 1.5rem;
}

.debug-filters {
  display: flex;
  gap: 0.75rem;
  padding: 1rem;
  background: white;
  border-radius: 8px;
  margin-bottom: 1rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  flex-wrap: wrap;
}

.filter-dropdown {
  width: 140px;
}

.search-input {
  flex: 1;
  min-width: 150px;
}

.clear-btn,
.autoscroll-btn {
  white-space: nowrap;
}

.debug-stats {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 0.75rem 1rem;
  background: white;
  border-radius: 8px;
  margin-bottom: 1rem;
  font-size: 0.875rem;
  color: #6b7280;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  flex-wrap: wrap;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 0.25rem;
}

.stat-divider {
  color: #d1d5db;
}

.debug-messages {
  background: #1f2937;
  border-radius: 8px;
  padding: 1rem;
  height: calc(100vh - 350px);
  overflow-y: auto;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.debug-message {
  background: #374151;
  border-radius: 6px;
  margin-bottom: 0.75rem;
  overflow: hidden;
  border-left: 4px solid;
}

.debug-message-log {
  border-left-color: #3b82f6;
}

.debug-message-info {
  border-left-color: #3b82f6;
}

.debug-message-warn {
  border-left-color: #f59e0b;
}

.debug-message-error {
  border-left-color: #ef4444;
}

.debug-message-debug {
  border-left-color: #8b5cf6;
}

.message-header {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.5rem 0.75rem;
  cursor: pointer;
  user-select: none;
  font-size: 0.75rem;
}

.message-header:hover {
  background: rgba(255, 255, 255, 0.1);
}

.copy-btn {
  margin-left: auto;
}

.message-level {
  font-weight: 700;
  font-size: 0.7rem;
  padding: 2px 6px;
  border-radius: 3px;
}

.level-log {
  background: rgba(59, 130, 246, 0.2);
  color: #60a5fa;
}

.level-info {
  background: rgba(59, 130, 246, 0.2);
  color: #60a5fa;
}

.level-warn {
  background: rgba(245, 158, 11, 0.2);
  color: #fbbf24;
}

.level-error {
  background: rgba(239, 68, 68, 0.2);
  color: #f87171;
}

.level-debug {
  background: rgba(139, 92, 246, 0.2);
  color: #a78bfa;
}

.message-time {
  color: #9ca3af;
  font-family: 'Courier New', monospace;
}

.message-preview {
  color: #d1d5db;
  font-size: 0.75rem;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  flex: 1;
  margin-left: 0.5rem;
}

.message-content {
  padding: 0.75rem;
  display: none;
  background: #111827;
}

.debug-message.expanded .message-content {
  display: block;
}

.message-text,
.message-stack,
.arg-value {
  margin: 0;
  white-space: pre-wrap;
  word-break: break-all;
  font-family: 'Courier New', monospace;
  font-size: 0.8125rem;
  line-height: 1.5;
  color: #d1d5db;
}

.message-text {
  color: #e5e7eb;
}

.message-stack {
  color: #f87171;
  margin: 0;
  padding: 0.5rem 0;
  border-top: 1px solid #374151;
}

.message-trace {
  color: #9ca3af;
  margin: 0;
  padding: 0.5rem 0;
  border-top: 1px solid #374151;
}

.stack-section {
  margin-top: 0.5rem;
}

.stack-label {
  display: block;
  font-size: 0.7rem;
  color: #6b7280;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: 0.25rem;
  padding-left: 0.5rem;
}

.no-messages {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem 1rem;
  color: #6b7280;
  text-align: center;
}

.no-messages i {
  font-size: 3rem;
  margin-bottom: 1rem;
  opacity: 0.5;
}

.no-messages p {
  margin: 0;
  font-size: 0.9rem;
}

@media (max-width: 768px) {
  .debug-view {
    padding: 1rem;
  }

  .debug-filters {
    padding: 0.75rem;
  }

  .filter-dropdown {
    width: 100%;
  }

  .search-input {
    min-width: 100%;
  }

  .clear-btn,
  .autoscroll-btn {
    width: 100%;
  }

  .debug-stats {
    padding: 0.5rem;
  }

  .debug-messages {
    height: calc(100vh - 450px);
  }
}
</style>
