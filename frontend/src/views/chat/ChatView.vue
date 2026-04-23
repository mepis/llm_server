<template>
  <div class="chat-container">
    <div v-if="chatStore.error" class="error-banner">
      {{ chatStore.error }}
      <button @click="chatStore.error = null">&times;</button>
    </div>
    <div class="chat-messages" ref="messagesContainer">
      <div v-if="messages.length === 0 && !loading" class="empty-state">
        <h2>Welcome to Chat</h2>
        <p>Start a conversation with the AI assistant</p>
      </div>
      <MessageBubble
        v-for="message in visibleMessages"
        :key="message.id"
        :role="message.role"
        :username="authStore.user?.username || ''"
        :timestamp="message.timestamp"
        :is-streaming="loading && message.role === 'assistant' && !hasStreamingContent"
      >
        <UserMessage
          v-if="message.role === 'user'"
          :content="message.content"
        />
        <AssistantMessage
          v-else-if="message.role === 'assistant'"
          :content="message.content"
          :tool-calls="message.tool_calls || []"
          :tool-results="message.tool_results || []"
          :raw-output="message.rawOutput || ''"
          :debug-mode="settingsStore.debugMode"
          :message-id="message.id"
          :is-streaming="loading && hasStreamingContent"
          :is-speaking="isSpeaking"
          :speaking-index="speakingIndex"
          @speak="(text) => speakMessage(text, message.id)"
        />
      </MessageBubble>
      <div v-if="loading && !hasStreamingContent" class="message assistant streaming">
        <div class="message-avatar"><i class="pi pi-robot"></i></div>
        <div class="message-content">
          <div class="message-role">Assistant</div>
          <ThinkingIndicator />
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
      <label class="auto-play-toggle">
        <input type="checkbox" :checked="settingsStore.autoPlayTTS" @change="settingsStore.setAutoPlayTTS($event.target.checked)" />
        <span>Auto-play</span>
      </label>
      <label class="auto-play-toggle">
        <input type="checkbox" :checked="settingsStore.debugMode" @change="settingsStore.setDebugMode($event.target.checked)" />
        <span>Debug</span>
      </label>
      <button v-if="showScrollButton" @click="handleScrollToBottom" class="scroll-bottom-inline" title="Scroll to bottom">
        <i class="pi pi-chevron-down"></i>
      </button>
      <button @click="sendMessage" :disabled="loading || !newMessage.trim()" class="send-button">
        <i class="pi pi-arrow-right"></i>
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, nextTick, watch, onMounted } from 'vue'
import { useChatStore } from '@/stores/chat'
import { useAuthStore } from '@/stores/auth'
import { useSettingsStore } from '@/stores/settings'
import axios from 'axios'
import MessageBubble from '@/components/chat/MessageBubble.vue'
import UserMessage from '@/components/chat/UserMessage.vue'
import AssistantMessage from '@/components/chat/AssistantMessage.vue'
import ThinkingIndicator from '@/components/chat/ThinkingIndicator.vue'

const chatStore = useChatStore()
const authStore = useAuthStore()
const settingsStore = useSettingsStore()
const messagesContainer = ref(null)
const newMessage = ref('')
const loading = ref(false)
const isSpeaking = ref(false)
const speakingIndex = ref([])
let currentAudio = null

const messages = computed(() => chatStore.currentChat?.messages || [])

 const visibleMessages = computed(() => messages.value)

const hasStreamingContent = computed(() => {
  return messages.value.some(m => m.role === 'assistant' && (m.content && m.content.length > 0 || m.tool_calls && m.tool_calls.length > 0))
})

const showScrollButton = ref(false)
const scrollBottom = () => {
  const el = messagesContainer.value
  if (!el) return
  showScrollButton.value = el.scrollTop + el.clientHeight < el.scrollHeight - 10
}

const handleScrollToBottom = async () => {
  await scrollToBottom()
  showScrollButton.value = false
}

const scrollToBottom = async () => {
  await nextTick()
  if (messagesContainer.value) {
    messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
  }
}

const stopSpeaking = () => {
  if (currentAudio) {
    currentAudio.pause()
    currentAudio = null
  }
  isSpeaking.value = false
  speakingIndex.value = []
}

const playAudio = async (text, messageId) => {
  stopSpeaking()

  try {
    const token = localStorage.getItem('token')
    const response = await axios.post('/api/llama/tts', { text }, {
      headers: { Authorization: `Bearer ${token}` },
      timeout: 60000,
    })

    if (response.data.success) {
      const binaryString = atob(response.data.data)
      const bytes = new Uint8Array(binaryString.length)
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i)
      }

      const blob = new Blob([bytes], { type: 'audio/wav' })
      const url = URL.createObjectURL(blob)

      currentAudio = new Audio(url)
      currentAudio.onended = () => {
        isSpeaking.value = false
        speakingIndex.value = []
        URL.revokeObjectURL(url)
      }
      await currentAudio.play()
      isSpeaking.value = true
      speakingIndex.value = [messageId]
    }
  } catch (error) {
    console.error('Failed to generate audio:', error.message || error)
    stopSpeaking()
  }
}

const speakMessage = async (text, messageId) => {
  if (isSpeaking.value && speakingIndex.value.includes(messageId)) {
    stopSpeaking()
    return
  }
  await playAudio(text, messageId)
}

const sendMessage = async () => {
  if (!newMessage.value.trim() || loading.value) return

  loading.value = true
  const content = newMessage.value.trim()
  newMessage.value = ''

  try {
    await chatStore.sendStreamingMessage(content)
  } catch (error) {
    console.error('Failed to send message:', error)
  } finally {
    loading.value = false
  }
}

const prevMessageCount = ref(0)


watch(messages, async (newMessages, oldMessages) => {
  const newLength = newMessages?.length || 0
  if (newLength <= prevMessageCount.value) {
    prevMessageCount.value = newLength
    return
  }

  await scrollToBottom()

  if (!settingsStore.autoPlayTTS) {
    prevMessageCount.value = newLength
    return
  }

  const lastMsg = newMessages[newLength - 1]
  if (lastMsg?.role === 'assistant' && lastMsg?.content) {
    playAudio(lastMsg.content, lastMsg.id)
  }

  prevMessageCount.value = newLength
}, { deep: true })

onMounted(async () => {
  if (!chatStore.currentChat && chatStore.sessions.length === 0) {
    try {
      await chatStore.listSessions()
    } catch (e) {
      console.error('Failed to load sessions:', e)
    }
  }

  const el = messagesContainer.value
  if (el) {
    el.addEventListener('scroll', scrollBottom, { passive: true })
  }
})
</script>

<style scoped>
.chat-container {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.error-banner {
  background: #fee2e2;
  color: #991b1b;
  padding: 0.75rem 1rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  font-size: 0.875rem;
}

.error-banner button {
  background: none;
  border: none;
  color: #991b1b;
  font-size: 1.25rem;
  cursor: pointer;
  padding: 0;
  line-height: 1;
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

.chat-input-container {
  display: flex;
  gap: 0.75rem;
  padding: 1rem 2rem;
  background: white;
  border-top: 1px solid #e5e7eb;
}

.chat-input-container textarea {
  flex: 1;
  min-width: 0;
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

.auto-play-toggle {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  cursor: pointer;
  font-size: 0.8rem;
  color: #6b7280;
  user-select: none;
}

.auto-play-toggle input[type="checkbox"] {
  width: 16px;
  height: 16px;
  accent-color: #2d6a4f;
  cursor: pointer;
}

@media (max-width: 768px) {
  .chat-messages {
    padding: 1rem;
  }

  .empty-state h2 {
    font-size: 1.25rem;
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

.scroll-bottom-inline {
  width: 40px;
  height: 40px;
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

.scroll-bottom-inline:hover {
  background: #22543d;
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
