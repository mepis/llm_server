<template>
  <div class="user-message">
    <div class="message-text" v-html="htmlContent"></div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { markdownToHtml } from '@/utils/markdown'

const props = defineProps({
  content: { type: String, default: '' },
})

const htmlContent = computed(() => markdownToHtml(props.content))
</script>

<style scoped>
.user-message {
  word-wrap: break-word;
  overflow-wrap: break-word;
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

.message-text :deep(hr) {
  border: none;
  border-top: 1px solid #e5e7eb;
  margin: 1rem 0;
}

.message-text :deep(img) {
  max-width: 100%;
  border-radius: 6px;
  margin: 0.5rem 0;
}
</style>
