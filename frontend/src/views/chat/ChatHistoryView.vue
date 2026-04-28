<template>
  <div class="history-container">
    <main class="history-main">
      <div class="history-header">
        <h1>Chat History</h1>
        <Button label="Chat" icon="pi pi-plus" @click="createNewChat" />
      </div>
      <div v-if="loading && sessions.length === 0" class="loading-state">
        <p>Loading chats...</p>
      </div>
      <div v-else-if="sessions.length === 0 && pagination.total === 0" class="empty-state">
        <p>No chat history yet. Start a new conversation!</p>
      </div>
      <div v-else class="chat-content">
        <div class="pagination-toolbar">
          <div class="page-size-selector">
            <Checkbox
              v-model:checked="selectAll"
              :indeterminate="someSelected"
              binary
              @click.stop
              @change="toggleAll"
            />
            <label>Select All</label>
          </div>
          <div class="toolbar-right">
            <Button
              v-if="selectedCount > 0"
              severity="danger"
              outlined
              icon="pi pi-trash"
              :label="`Delete Selected (${selectedCount})`"
              @click.stop="deleteSelected"
            />
            <span class="record-info">{{ pagination.total }} total chats</span>
          </div>
        </div>
        <div v-if="sessions.length > 0" class="chat-list">
          <div
            v-for="session in sessions"
            :key="session.chat_id"
            :class="['chat-item', { active: currentChatId === session.chat_id }]"
            @click="loadChat(session.chat_id)"
          >
            <div @click.stop>
              <Checkbox
                :modelValue="selectedChats.has(session.chat_id)"
                @update:modelValue="(val) => toggleChatSelection(session.chat_id, val)"
                binary
                class="chat-checkbox"
              />
            </div>
            <div class="chat-info">
              <h3>{{ session.session_name || 'Untitled Chat' }}</h3>
              <p class="last-message">{{ session.message_count }} message{{ session.message_count !== 1 ? 's' : '' }}{{ session.last_message ? ' - ' + session.last_message : '' }}</p>
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
        <Paginator
          :first="paginatorFirst"
          :rows="pagination.limit"
          :totalRecords="pagination.total"
          :showFirstLastButtons="true"
          @page="onPageChange"
        />
      </div>
    </main>

    <Dialog
      v-model:visible="deleteDialogVisible"
      header="Confirm Delete"
      modal
      :style="{ width: '400px' }"
    >
      <p class="delete-message" v-if="selectedCount > 1">
        Are you sure you want to delete <strong>{{ selectedCount }}</strong> selected chats? This action cannot be undone.
      </p>
      <p class="delete-message" v-else>
        Are you sure you want to delete chat
        <strong>"{{ deleteChatTarget?.session_name || 'Untitled Chat' }}"</strong>? This action cannot be undone.
      </p>
      <template #footer>
        <Button label="Cancel" outlined @click="deleteDialogVisible = false" />
        <Button
          :label="selectedCount > 1 ? `Delete ${selectedCount} Chats` : 'Delete'"
          severity="danger"
          @click="executeDelete"
          :disabled="loading"
        />
      </template>
    </Dialog>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useChatStore } from '@/stores/chat'
import { useSettingsStore } from '@/stores/settings'
import { useAuthStore } from '@/stores/auth'

import Button from 'primevue/button'
import Checkbox from 'primevue/checkbox'
import Dialog from 'primevue/dialog'
import Paginator from 'primevue/paginator'

const router = useRouter()
const chatStore = useChatStore()
const settingsStore = useSettingsStore()
const authStore = useAuthStore()
const loading = ref(false)
const deleteDialogVisible = ref(false)
const deleteChatTarget = ref(null)
const selectedChats = ref(new Set())

const sessions = computed(() => chatStore.sessions)
const pagination = computed(() => ({ ...chatStore.pagination }))
const currentChatId = ref(null)

const selectAll = computed({
  get: () => sessions.value.length > 0 && sessions.value.every(s => selectedChats.value.has(s.chat_id)),
  set: (val) => {
    if (val) {
      const s = new Set(selectedChats.value)
      sessions.value.forEach(sess => s.add(sess.chat_id))
      selectedChats.value = s
    } else {
      selectedChats.value = new Set()
    }
  }
})

const someSelected = computed(() => {
  const hasSelected = sessions.value.some(s => selectedChats.value.has(s.chat_id))
  return hasSelected && !selectAll.value
})

const selectedCount = computed(() => selectedChats.value.size)

const paginatorFirst = computed(() => {
  const pageOffset = (pagination.value.page - 1) * pagination.value.limit
  return pageOffset
})

const formatDate = (dateString) => {
  if (!dateString) return ''
  const date = new Date(dateString)
  return date.toLocaleString([], { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' })
}

const loadSessions = async (opts = {}) => {
  loading.value = true
  try {
    await chatStore.listSessions(opts)
  } catch (error) {
    console.error('Failed to load sessions:', error)
  } finally {
    loading.value = false
  }
}

const onPageChange = async (event) => {
  selectedChats.value = new Set()
  loadSessions({ page: event.page + 1, limit: event.rows })
}

const onPageSizeChange = async () => {
  try {
    await settingsStore.updateUserPreferences({ chat_page_size: pagination.value.limit })
    await authStore.fetchUser()
  } catch (error) {
    console.error('Failed to save page size preference:', error)
  }
  loadSessions({ page: 1, limit: pagination.value.limit })
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
    const newChat = await chatStore.createSession('New Chat', false)
    currentChatId.value = newChat.chat_id
    router.push('/chat')
  } catch (error) {
    console.error('Failed to create chat:', error)
  }
}

const deleteChat = (chatId) => {
  const session = sessions.value.find(s => s.chat_id === chatId)
  deleteChatTarget.value = session ? { chat_id: chatId, session_name: session.session_name } : { chat_id: chatId, session_name: 'Untitled Chat' }
  deleteDialogVisible.value = true
}

const toggleAll = () => {
  selectAll.value = !selectAll.value
}

const deleteSelected = () => {
  deleteChatTarget.value = null
  deleteDialogVisible.value = true
}

const toggleChatSelection = (chatId, checked) => {
  const s = new Set(selectedChats.value)
  if (checked) {
    s.add(chatId)
  } else {
    s.delete(chatId)
  }
  selectedChats.value = s
}

const executeDelete = async () => {
  try {
    const selectedIds = Array.from(selectedChats.value)

    if (selectedIds.length > 1) {
      await chatStore.bulkDeleteChats(selectedIds)
    } else if (deleteChatTarget.value?.chat_id) {
      await chatStore.deleteChat(deleteChatTarget.value.chat_id)
    }

    if (currentChatId.value && selectedChats.value.has(currentChatId.value)) {
      currentChatId.value = null
    }

    selectedChats.value = new Set()
    deleteDialogVisible.value = false
  } catch (error) {
    console.error('Failed to delete chat:', error)
  }
}

onMounted(async () => {
  try {
    await settingsStore.fetchUserPreferences()
  } catch (error) {
    console.error('Failed to fetch user preferences:', error)
  }
  const preferredPageSize = settingsStore.userPreferences?.chat_page_size || 10
  await loadSessions({ page: 1, limit: preferredPageSize })

  const hasStale = sessions.value.some(s => s.session_name === 'New Chat')
  if (hasStale) {
    try {
      const updated = await chatStore.regenerateStaleSubjects()
      if (updated) {
        await loadSessions({ page: 1, limit: preferredPageSize })
      }
    } catch (error) {
      console.error('Failed to regenerate stale subjects:', error)
    }
  }
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

.chat-content {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.pagination-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.5rem 0;
}

.page-size-selector {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
  color: #6b7280;
}

.page-size-selector select {
  padding: 0.25rem 0.5rem;
  border: 1px solid #d1d5db;
  border-radius: 4px;
  background: white;
  font-size: 0.875rem;
  color: #374151;
  cursor: pointer;
}

.page-size-selector select:focus {
  outline: none;
  border-color: #2d6a4f;
  box-shadow: 0 0 0 2px rgba(45, 106, 79, 0.1);
}

.record-info {
  font-size: 0.875rem;
  color: #9ca3af;
}

.toolbar-right {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.chat-checkbox {
  margin-right: 0.75rem;
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

.delete-message {
  margin: 0 0 1rem 0;
  color: #374151;
  font-size: 0.875rem;
}

@media (max-width: 768px) {
  .history-main {
    margin-left: 0;
    padding: 1rem;
  }

  .history-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 1rem;
  }

  .history-header h1 {
    font-size: 1.5rem;
  }

  .chat-item {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.75rem;
  }

  .chat-meta {
    width: 100%;
    justify-content: space-between;
  }
}
</style>