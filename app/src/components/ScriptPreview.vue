<template>
  <div class="modal-overlay" @click.self="close">
    <div class="modal">
      <div class="modal-header">
        <h2 class="modal-title">Script Preview</h2>
        <button @click="close" class="modal-close">&times;</button>
      </div>
      
      <div class="modal-content">
        <div class="preview-box">{{ script }}</div>
      </div>
      
      <div class="modal-footer">
        <button @click="close" class="btn btn-secondary">Close</button>
        <button @click="copyToClipboard" class="btn btn-secondary">Copy</button>
        <button @click="runScript" class="btn btn-primary">Run Script</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const props = defineProps({
  script: String,
  scriptName: String,
  scriptType: String
})

const emit = defineEmits(['close', 'run'])

function close() {
  emit('close')
}

async function copyToClipboard() {
  try {
    await navigator.clipboard.writeText(props.script)
    alert('Script copied to clipboard!')
  } catch (err) {
    alert('Failed to copy: ' + err.message)
  }
}

function runScript() {
  emit('run', props.scriptType, props.scriptName, props.script)
}
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal {
  background-color: var(--bg-secondary);
  border-radius: 12px;
  width: 90%;
  max-width: 900px;
  max-height: 90vh;
  overflow-y: auto;
  border: 1px solid var(--border-medium);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  border-bottom: 1px solid var(--border-light);
}

.modal-title {
  font-size: 1.25rem;
  color: var(--color-mint-light);
}

.modal-close {
  background: none;
  border: none;
  color: var(--text-muted);
  font-size: 1.5rem;
  cursor: pointer;
  padding: 0;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.modal-close:hover {
  color: var(--text-primary);
}

.modal-content {
  padding: 24px;
}

.preview-box {
  background-color: var(--bg-primary);
  border: 1px solid var(--border-medium);
  border-radius: 8px;
  padding: 20px;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 0.875rem;
  color: var(--text-secondary);
  white-space: pre-wrap;
  word-break: break-all;
  max-height: 500px;
  overflow-y: auto;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 20px 24px;
  border-top: 1px solid var(--border-light);
}
</style>
