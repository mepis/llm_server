<template>
  <div class="history-container">
    <Header />
    <Sidebar />
    <main class="history-main">
      <div class="history-header">
        <h1>Chat History</h1>
        <Button label="New Chat" icon="pi pi-plus" @click="createNewChat" />
      </div>
      <div v-if="loading" class="loading-state">
        <p>Loading chats...</p>
      </div>
      <div v-else-if="sessions.length === 0" class="empty-state">
        <p>No chat history yet. Start a new conversation!</p>
      </div>
      <div v-else class="chat-list">
        <div
          v-for="session in sessions"
          :key="session.chat_id"
          :class="['chat-item', { active: currentChatId === session.chat_id }]"
          @click="loadChat(session.chat_id)"
        >
          <div class="chat-info">
            <h3>{{ session.session_name || 'Untitled Chat' }}</h3>
            <p class="last-message">{{ session.last_message || 'No messages' }}</p>
          </div>
          <div class="chat-meta">
            <span class="date">{{ formatDate(session.updated_at) }}</span>
            <Button
              severity="danger"
              text
              icon="pi pi-trash"
              @click.stop="deleteChat(session.chat_id)"
            />
          </div>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useChatStore } from '@/stores/chat'
import Header from '@/components/layout/Header.vue'
import Sidebar from '@/components/layout/Sidebar.vue'
import Button from 'primevue/button'

const router = useRouter()
const chatStore = useChatStore()
const loading = ref(false)

const sessions = computed(() => chatStore.sessions)
const currentChatId = ref(null)

const formatDate = (dateString) => {
  if (!dateString) return ''
  const date = new Date(dateString)
  return date.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })
}

const loadSessions = async () => {
  loading.value = true
  try {
    await chatStore.listSessions()
  } catch (error) {
    console.error('Failed to load sessions:', error)
  } finally {
    loading.value = false
  }
}

const loadChat = async (chatId) => {
  try {
    currentChatId.value = chatId
    await chatStore.loadChat(chatId)
    router.push('/chat')
  } catch (error) {
    console.error('Failed to load chat:', error)
  }
}

const createNewChat = async () => {
  try {
    const newChat = await chatStore.createSession()
    currentChatId.value = newChat.chat_id
    router.push('/chat')
  } catch (error) {
    console.error('Failed to create chat:', error)
  }
}

const deleteChat = async (chatId) => {
  if (!confirm('Are you sure you want to delete this chat?')) return
  
  try {
    await chatStore.deleteChat(chatId)
    if (currentChatId.value === chatId) {
      currentChatId.value = null
    }
  } catch (error) {
    console.error('Failed to delete chat:', error)
  }
}

onMounted(() => {
  loadSessions()
})
</script>

<style scoped>
.history-container {
  display: flex;
  flex-direction: column;
  height: 100vh;
}

.history-main {
  flex: 1;
  margin-left: 250px;
  padding: 2rem;
  background: #f9fafb;
  overflow-y: auto;
}

.history-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
}

.history-header h1 {
  font-size: 1.875rem;
  color: #111827;
  margin: 0;
}

.loading-state,
.empty-state {
  text-align: center;
  padding: 4rem 2rem;
  color: #6b7280;
}

.chat-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.chat-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.25rem;
  background: white;
  border-radius: 8px;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
  cursor: pointer;
  transition: all 0.2s;
}

.chat-item:hover {
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.chat-item.active {
  border-left: 4px solid #2d6a4f;
  background: #f0fdf4;
}

.chat-info {
  flex: 1;
  min-width: 0;
}

.chat-info h3 {
  font-size: 1rem;
  font-weight: 600;
  color: #111827;
  margin: 0 0 0.25rem 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.last-message {
  font-size: 0.875rem;
  color: #6b7280;
  margin: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.chat-meta {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.date {
  font-size: 0.75rem;
  color: #9ca3af;
}
</style>