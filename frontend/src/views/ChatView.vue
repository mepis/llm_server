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
            {{ message.role === 'user' ? 'U' : 'AI' }}
          </div>
          <div class="message-content">
            <div class="message-role">{{ message.role }}</div>
            <div class="message-text">{{ message.content }}</div>
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

const chatStore = useChatStore()
const messagesContainer = ref(null)
const newMessage = ref('')
const loading = ref(false)

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

const sendMessage = async () => {
  if (!newMessage.value.trim() || loading.value) return
  
  loading.value = true
  const content = newMessage.value.trim()
  newMessage.value = ''
  
  try {
    await chatStore.addMessage(content)
    await scrollToBottom()
  } catch (error) {
    console.error('Failed to send message:', error)
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
</style>