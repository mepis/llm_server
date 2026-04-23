<template>
  <div class="assistant-message">
    <div v-if="textContent" class="message-text" v-html="htmlContent"></div>

    <button
      v-if="textContent"
      @click="$emit('speak', textContent)"
      :class="['speaker-button', { speaking: isSpeaking }]"
      :disabled="isSpeaking && !speakingIndex.includes(messageId)"
      title="Speak"
    >
      <i :class="isSpeaking && speakingIndex.includes(messageId) ? 'pi pi-pause-circle' : 'pi pi-volume-up'"></i>
    </button>

    <div v-if="toolCalls && toolCalls.length > 0" class="tool-calls-section">
      <ToolCallCard
        v-for="tc in toolCalls"
        :key="tc.id || tc.tool_call_id"
        :tool-call="tc"
        :is-streaming="isStreaming"
      />
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { markdownToHtml } from '@/utils/markdown'
import ToolCallCard from './ToolCallCard.vue'

const props = defineProps({
  content: { type: String, default: '' },
  toolCalls: { type: Array, default: () => [] },
  messageId: { type: String, default: '' },
  isStreaming: { type: Boolean, default: false },
  isSpeaking: { type: Boolean, default: false },
  speakingIndex: { type: Array, default: () => [] },
})

defineEmits(['speak'])

const textContent = computed(() => props.content || '')

const htmlContent = computed(() => markdownToHtml(props.content))
</script>

<style scoped>
.assistant-message {
  word-wrap: break-word;
  overflow-wrap: break-word;
}

.message-text {
  color: #374151;
  line-height: 1.6;
}

.message-text :deep(h1), .message-text :deep(h2), .message-text :deep(h3),
.message-text :deep(h4), .message-text :deep(h5), .message-text :deep(h6) {
  margin: 0.75rem 0 0.5rem;
  font-weight: 600;
  line-height: 1.3;
}

.message-text :deep(h1) { font-size: 1.5rem; }
.message-text :deep(h2) { font-size: 1.25rem; }
.message-text :deep(h3) { font-size: 1.125rem; }

.message-text :deep(p) { margin: 0.5rem 0; }

.message-text :deep(ul), .message-text :deep(ol) {
  margin: 0.5rem 0;
  padding-left: 1.5rem;
}

.message-text :deep(li) { margin: 0.25rem 0; }

.message-text :deep(strong) { font-weight: 600; color: #1f2937; }

.message-text :deep(a) {
  color: #2d6a4f;
  text-decoration: underline;
}

.message-text :deep(a:hover) { color: #22543d; }

.message-text :deep(blockquote) {
  margin: 0.5rem 0;
  padding: 0.5rem 1rem;
  border-left: 3px solid #d1d5db;
  color: #6b7280;
}

.message-text :deep(code) {
  background: #f3f4f6;
  padding: 0.15rem 0.35rem;
  border-radius: 3px;
  font-family: 'Courier New', Courier, monospace;
  font-size: 0.875em;
  color: #1f2937;
}

.message-text :deep(pre) {
  background: #f3f4f6;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  padding: 0.75rem;
  margin: 0.75rem 0;
  overflow-x: auto;
}

.message-text :deep(pre code) {
  background: none;
  padding: 0;
  font-size: 0.8rem;
  color: #374151;
}

.message-text :deep(hr) { border: none; border-top: 1px solid #e5e7eb; margin: 1rem 0; }
.message-text :deep(img) { max-width: 100%; border-radius: 6px; margin: 0.5rem 0; }

.speaker-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border: none;
  border-radius: 4px;
  background: transparent;
  color: #9ca3af;
  cursor: pointer;
  margin-left: 0.5rem;
  transition: all 0.2s;
  font-size: 1rem;
  vertical-align: middle;
}

.speaker-button:hover:not(:disabled) {
  background: #f3f4f6;
  color: #2d6a4f;
}

.speaker-button.speaking { color: #2d6a4f; }
.speaker-button:disabled { opacity: 0.3; cursor: not-allowed; }

.tool-calls-section {
  margin-top: 0.75rem;
}
</style>
