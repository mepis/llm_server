<template>
  <div class="documents-container">
    <main class="documents-main">
      <div class="documents-header">
        <h1>Document Library</h1>
        <div class="header-actions">
          <input
            type="file"
            ref="fileInput"
            @change="handleFileUpload"
            style="display: none"
          />
          <Button
            label="Upload Document"
            icon="pi pi-upload"
            @click="$refs.fileInput.click()"
          />
        </div>
      </div>

      <div v-if="loading" class="loading-state">
        <p>Loading documents...</p>
      </div>

      <div v-else-if="documents.length === 0" class="empty-state">
        <p>No documents uploaded yet. Upload a document to get started with RAG!</p>
      </div>

      <div v-else class="documents-grid">
        <div v-for="doc in documents" :key="doc._id" class="document-card">
          <div class="doc-icon">
            <i :class="getDocumentIcon(doc.file_type)"></i>
          </div>
          <div class="doc-info">
            <h3>{{ doc.filename }}</h3>
            <p class="doc-type">{{ formatFileType(doc.file_type) }}</p>
            <div class="doc-meta">
              <span class="status" :class="doc.status">
                {{ doc.status }}
              </span>
              <span class="date">{{ formatDate(doc.uploaded_at) }}</span>
            </div>
          </div>
          <div class="doc-actions">
            <Button
              severity="danger"
              text
              icon="pi pi-trash"
              @click="deleteDocument(doc._id)"
            />
          </div>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRAGStore } from '@/stores/rag'

import Button from 'primevue/button'

const ragStore = useRAGStore()
const loading = ref(false)

const documents = computed(() => ragStore.documents)

const getDocumentIcon = (fileType) => {
  if (fileType?.includes('pdf')) return 'pi pi-file-pdf'
  if (fileType?.includes('word') || fileType?.includes('document')) return 'pi pi-file-word'
  if (fileType?.includes('text')) return 'pi pi-file-text'
  if (fileType?.includes('image')) return 'pi pi-file-image'
  return 'pi pi-file'
}

const formatFileType = (fileType) => {
  if (!fileType) return 'Unknown'
  const type = fileType.split('/')[1] || fileType
  return type.toUpperCase().replace('-', ' ')
}

const formatDate = (dateString) => {
  if (!dateString) return ''
  const date = new Date(dateString)
  return date.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })
}

const handleFileUpload = async (event) => {
  const file = event.target.files[0]
  if (!file) return

  loading.value = true
  try {
    const formData = new FormData()
    formData.append('file', file)
    
    await ragStore.uploadDocument(formData)
    
    event.target.value = ''
  } catch (error) {
    console.error('Failed to upload document:', error)
    alert('Failed to upload document: ' + (error.response?.data?.message || error.message))
  } finally {
    loading.value = false
  }
}

const deleteDocument = async (docId) => {
  if (!confirm('Are you sure you want to delete this document?')) return
  
  try {
    await ragStore.deleteDocument(docId)
  } catch (error) {
    console.error('Failed to delete document:', error)
    alert('Failed to delete document')
  }
}

const loadDocuments = async () => {
  loading.value = true
  try {
    await ragStore.listDocuments()
  } catch (error) {
    console.error('Failed to load documents:', error)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadDocuments()
})
</script>

<style scoped>
.documents-container {
  display: flex;
  flex-direction: column;
  height: 100vh;
}

.documents-main {
  flex: 1;
  padding: 2rem;
  background: #f9fafb;
  overflow-y: auto;
}

.documents-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
}

.documents-header h1 {
  font-size: 1.875rem;
  color: #111827;
  margin: 0;
}

.header-actions {
  display: flex;
  gap: 1rem;
}

.loading-state,
.empty-state {
  text-align: center;
  padding: 4rem 2rem;
  color: #6b7280;
}

.documents-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 1.25rem;
}

.document-card {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1.25rem;
  background: white;
  border-radius: 8px;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
  transition: all 0.2s;
}

.document-card:hover {
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.doc-icon {
  width: 48px;
  height: 48px;
  border-radius: 8px;
  background: #f3f4f6;
  display: flex;
  align-items: center;
  justify-content: center;
}

.doc-icon i {
  font-size: 1.5rem;
  color: #2d6a4f;
}

.doc-info {
  flex: 1;
  min-width: 0;
}

.doc-info h3 {
  font-size: 1rem;
  font-weight: 600;
  color: #111827;
  margin: 0 0 0.25rem 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.doc-type {
  font-size: 0.75rem;
  color: #9ca3af;
  margin: 0 0 0.5rem 0;
}

.doc-meta {
  display: flex;
  gap: 0.75rem;
  align-items: center;
}

.status {
  font-size: 0.75rem;
  padding: 0.25rem 0.75rem;
  border-radius: 12px;
  font-weight: 600;
  text-transform: capitalize;
}

.status.processed {
  background: #d1fae5;
  color: #065f46;
}

.status.processing {
  background: #fef3c7;
  color: #92400e;
}

.status.error {
  background: #fee2e2;
  color: #991b1b;
}

.date {
  font-size: 0.75rem;
  color: #9ca3af;
}

.doc-actions {
  display: flex;
  gap: 0.5rem;
}

@media (max-width: 768px) {
  .documents-main {
    margin-left: 0;
    padding: 1rem;
  }

  .documents-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 1rem;
  }

  .documents-header h1 {
    font-size: 1.5rem;
  }

  .documents-grid {
    grid-template-columns: 1fr;
  }

  .document-card {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.75rem;
  }

  .doc-actions {
    width: 100%;
    display: flex;
    justify-content: flex-end;
  }
}
</style>