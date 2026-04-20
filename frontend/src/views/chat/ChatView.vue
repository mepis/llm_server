<template>
  <div class="chat-container">
    <Header />
    <Sidebar />
    <main class="chat-main">
      <div class="chat-messages" ref="messagesContainer">
        <div v-if="messages.length === 0" class="empty-state">
          <h2>Welcome to Chat</h2>
          <p>Start a conversation with the AI assistant</p>
        </div>
        <div v-for="(message, index) in messages" :key="index" :class="['message', message.role]">
          <div class="message-avatar">
            {{ message.role === 'user' ? 'U' : message.role === 'tool' ? 'T' : 'AI' }}
          </div>
          <div class="message-content">
            <div class="message-role">{{ message.role }}</div>

            <div v-if="message.role === 'user'" class="message-text">{{ message.content }}</div>

            <div v-else-if="message.role === 'assistant' && message.content" class="message-text">{{ message.content }}</div>

            <div v-else-if="message.role === 'assistant' && message.tool_calls" class="tool-calls-section">
              <div v-for="tc in message.tool_calls" :key="tc.id || tc.tool_call_id" class="tool-call-item">
                <div class="tool-call-header">
                  <i class="pi pi-cog"></i>
                  <span>Calling {{ tc.function?.name || tc.tool_name }}</span>
                </div>
                <div v-if="tc.function?.arguments" class="tool-call-input">
                  <pre>{{ JSON.stringify(JSON.parse(tc.function.arguments), null, 2) }}</pre>
                </div>
              </div>
            </div>

            <div v-else-if="message.role === 'tool'" class="tool-result">
              <div class="tool-result-header">
                <i class="pi pi-check-circle"></i>
                <span>Tool Result</span>
                <Button
                  text
                  size="small"
                  :label="expandedMessages.has(message.timestamp + index) ? 'Collapse' : 'Expand'"
                  @click="toggleExpand(message.timestamp + index)"
                />
              </div>
              <div class="tool-result-content" :class="{ collapsed: !expandedMessages.has(message.timestamp + index) }">
                <pre>{{ message.content }}</pre>
              </div>
            </div>

            <div class="message-time">{{ formatTime(message.timestamp) }}</div>
          </div>
        </div>
        <div v-if="loading" class="message assistant">
          <div class="message-avatar">AI</div>
          <div class="message-content">
            <div class="message-role">assistant</div>
            <div class="message-text typing-indicator">
              <span></span>
              <span></span>
              <span></span>
            </div>
          </div>
        </div>
      </div>
      <div class="chat-input-container">
        <textarea
          v-model="newMessage"
          @keydown.enter.prevent="sendMessage"
          placeholder="Type your message..."
          rows="1"
          :disabled="loading"
        ></textarea>
        <button @click="sendMessage" :disabled="loading || !newMessage.trim()" class="send-button">
          <i class="pi pi-paper-plane"></i>
        </button>
      </div>
    </main>
  </div>
</template>

<script setup>
import { ref, computed, nextTick } from 'vue'
import { useChatStore } from '@/stores/chat'
import Header from '@/components/layout/Header.vue'
import Sidebar from '@/components/layout/Sidebar.vue'
import Button from 'primevue/button'

const chatStore = useChatStore()
const messagesContainer = ref(null)
const newMessage = ref('')
const loading = ref(false)
const expandedMessages = ref(new Set())

const messages = computed(() => chatStore.currentChat?.messages || [])

const formatTime = (timestamp) => {
  if (!timestamp) return ''
  const date = new Date(timestamp)
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

const scrollToBottom = async () => {
  await nextTick()
  if (messagesContainer.value) {
    messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
  }
}

const toggleExpand = (key) => {
  const set = expandedMessages.value
  if (set.has(key)) {
    set.delete(key)
  } else {
    set.add(key)
  }
  expandedMessages.value = new Set(set)
}

const sendMessage = async () => {
  if (!newMessage.value.trim() || loading.value) return

  loading.value = true
  const content = newMessage.value.trim()
  newMessage.value = ''

  try {
    await chatStore.sendMessage(content)
    await scrollToBottom()
  } catch (error) {
    console.error('Failed to send message:', error)
    if (chatStore.currentChat && chatStore.currentChat.messages.length > 0) {
      const lastMsg = chatStore.currentChat.messages[chatStore.currentChat.messages.length - 1]
      if (lastMsg.role === 'user') {
        chatStore.currentChat.messages.pop()
      }
    }
    if (chatStore.error) {
      console.error('Chat error:', chatStore.error)
    }
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.chat-container {
  display: flex;
  flex-direction: column;
  height: 100vh;
}

.chat-main {
  flex: 1;
  margin-left: 250px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  transition: margin-left 0.3s ease;
}

.chat-messages {
  flex: 1;
  overflow-y: auto;
  padding: 2rem;
  background: #f9fafb;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: #6b7280;
}

.empty-state h2 {
  font-size: 1.5rem;
  color: #374151;
  margin-bottom: 0.5rem;
}

.message {
  display: flex;
  gap: 1rem;
  padding: 1rem;
  margin-bottom: 1rem;
  background: white;
  border-radius: 8px;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
}

.message.user {
  flex-direction: row-reverse;
}

.message-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 0.875rem;
}

.message.user .message-avatar {
  background: #2d6a4f;
  color: white;
}

.message.assistant .message-avatar {
  background: #e5e7eb;
  color: #374151;
}

.message.tool .message-avatar {
  background: #fef3c7;
  color: #92400e;
}

.message-content {
  flex: 1;
  max-width: 600px;
}

.message-role {
  font-size: 0.75rem;
  font-weight: 600;
  color: #9ca3af;
  text-transform: uppercase;
  margin-bottom: 0.25rem;
}

.message-text {
  color: #374151;
  line-height: 1.5;
}

.typing-indicator {
  display: flex;
  gap: 0.25rem;
  padding: 0.5rem 0;
}

.typing-indicator span {
  width: 8px;
  height: 8px;
  background: #9ca3af;
  border-radius: 50%;
  animation: bounce 1.4s infinite ease-in-out;
}

.typing-indicator span:nth-child(1) {
  animation-delay: -0.32s;
}

.typing-indicator span:nth-child(2) {
  animation-delay: -0.16s;
}

@keyframes bounce {
  0%, 80%, 100% {
    transform: scale(0);
  }
  40% {
    transform: scale(1);
  }
}

.message-time {
  font-size: 0.75rem;
  color: #9ca3af;
  margin-top: 0.5rem;
}

.tool-calls-section {
  margin-top: 0.5rem;
}

.tool-call-item {
  background: #f0fdf4;
  border: 1px solid #bbf7d0;
  border-radius: 6px;
  padding: 0.75rem;
  margin-bottom: 0.5rem;
}

.tool-call-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
  font-weight: 600;
  color: #166534;
  margin-bottom: 0.5rem;
}

.tool-call-input {
  margin-top: 0.5rem;
}

.tool-call-input pre {
  background: #f9fafb;
  padding: 0.5rem;
  border-radius: 4px;
  font-size: 0.75rem;
  overflow-x: auto;
  color: #374151;
  margin: 0;
}

.tool-result {
  margin-top: 0.5rem;
}

.tool-result-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
  font-weight: 600;
  color: #92400e;
  margin-bottom: 0.5rem;
}

.tool-result-content {
  background: #fffbeb;
  border: 1px solid #fde68a;
  border-radius: 6px;
  padding: 0.75rem;
  max-height: 200px;
  overflow-y: auto;
}

.tool-result-content.collapsed {
  max-height: 60px;
  overflow: hidden;
}

.tool-result-content pre {
  margin: 0;
  font-size: 0.8rem;
  white-space: pre-wrap;
  word-break: break-word;
  color: #374151;
}

.chat-input-container {
  display: flex;
  gap: 0.75rem;
  padding: 1rem 2rem;
  background: white;
  border-top: 1px solid #e5e7eb;
}

.chat-input-container textarea {
  flex: 1;
  padding: 0.75rem;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  font-size: 1rem;
  resize: none;
  font-family: inherit;
}

.chat-input-container textarea:focus {
  outline: none;
  border-color: #2d6a4f;
}

.send-button {
  width: 48px;
  height: 48px;
  border: none;
  border-radius: 8px;
  background: #2d6a4f;
  color: white;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.2s;
}

.send-button:hover:not(:disabled) {
  background: #22543d;
}

.send-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.send-button i {
  font-size: 1.25rem;
}

@media (max-width: 768px) {
  .chat-main {
    margin-left: 0;
  }

  .chat-messages {
    padding: 1rem;
  }

  .empty-state h2 {
    font-size: 1.25rem;
  }

  .message {
    padding: 0.75rem;
    gap: 0.75rem;
  }

  .message-avatar {
    width: 32px;
    height: 32px;
    font-size: 0.75rem;
  }

  .message-content {
    max-width: 100%;
  }

  .chat-input-container {
    padding: 0.75rem;
    gap: 0.5rem;
  }

  .chat-input-container textarea {
    font-size: 0.9rem;
    padding: 0.625rem;
  }

  .send-button {
    width: 44px;
    height: 44px;
  }
}

@media (max-width: 480px) {
  .chat-input-container {
    flex-direction: column;
  }

  .send-button {
    width: 100%;
    height: 48px;
    border-radius: 8px;
  }
}
</style>
