<template>
  <div class="groups-container">
    <main class="groups-main">
      <div class="groups-header">
        <h1>Document Groups</h1>
        <Button label="Create Group" icon="pi pi-plus" @click="showCreateDialog = true" />
      </div>

      <div v-if="loading" class="loading-state">
        <p>Loading groups...</p>
      </div>

      <div v-else-if="groups.length === 0" class="empty-state">
        <p>No document groups yet. Create a group to share documents with others.</p>
      </div>

      <div v-else class="groups-grid">
        <div v-for="group in groups" :key="group.id" class="group-card" @click="selectGroup(group)">
          <div class="group-info">
            <h3>{{ group.name }}</h3>
            <p class="group-desc">{{ group.description || 'No description' }}</p>
            <div class="group-meta">
              <Badge v-for="role in parseRoles(group.roles)" :key="role" :value="role" />
              <span class="doc-count">{{ group.documents?.length || 0 }} docs</span>
            </div>
          </div>
        </div>
      </div>

      <div v-if="selectedGroup" class="group-detail">
        <div class="detail-header">
          <h2>{{ selectedGroup.name }}</h2>
          <div>
            <Button label="Edit" icon="pi pi-pencil" text @click="openEditDialog" />
            <Button label="Delete" severity="danger" icon="pi pi-trash" text @click="confirmDelete = true" />
            <Button label="Back" icon="pi pi-arrow-left" text @click="selectedGroup = null" />
          </div>
        </div>

        <div class="documents-list">
          <div v-for="docRef in selectedGroup.documents" :key="docRef.document_id?.id || docRef.document_id" class="doc-item">
            <span>{{ docRef.document_id?.filename || 'Unknown document' }}</span>
            <Badge :value="docRef.document_id?.file_type" />
            <div v-if="isOwner || isAdmin" class="doc-actions">
              <Button icon="pi pi-trash" text severity="danger" @click="removeDocument(docRef.document_id?.id || docRef.document_id)" />
            </div>
          </div>
          <div v-if="(isOwner || isAdmin) && accessibleDocs.length > 0" class="add-doc-form">
            <Select v-model="selectedDocToAdd" :options="accessibleDocs" optionLabel="filename" placeholder="Select document" />
            <Button label="Add" icon="pi pi-plus" @click="addDocument()" />
          </div>
        </div>
      </div>
    </main>

    <Dialog v-model:visible="showCreateDialog" header="Create New Group" modal :style="{ width: '400px' }">
      <div class="create-form">
        <label>Name</label>
        <InputText v-model="createForm.name" placeholder="Group name" />
        <label>Description (optional)</label>
        <InputText v-model="createForm.description" placeholder="Description" />
        <label>Roles</label>
        <div class="role-checkboxes">
          <label v-for="role in availableRoles" :key="role" class="role-checkbox">
            <Checkbox v-model="selectedCreateRoles" inputId="create-role-{{ role }}" :value="role" />
            <span>{{ role }}</span>
          </label>
        </div>
      </div>
      <template #footer>
        <Button label="Cancel" text @click="showCreateDialog = false" />
        <Button label="Create" @click="createGroup()" :disabled="!createForm.name" />
      </template>
    </Dialog>

    <Dialog v-model:visible="showEditDialog" header="Edit Group" modal :style="{ width: '400px' }">
      <div class="create-form">
        <label>Name</label>
        <InputText v-model="editForm.name" />
        <label>Description</label>
        <InputText v-model="editForm.description" />
        <label>Roles</label>
        <div class="role-checkboxes">
          <label v-for="role in availableRoles" :key="role" class="role-checkbox">
            <Checkbox v-model="selectedEditRoles" inputId="edit-role-{{ role }}" :value="role" />
            <span>{{ role }}</span>
          </label>
        </div>
      </div>
      <template #footer>
        <Button label="Cancel" text @click="showEditDialog = false" />
        <Button label="Save" @click="updateGroup()" />
      </template>
    </Dialog>

    <Dialog v-model:visible="confirmDelete" header="Delete Group" modal :style="{ width: '400px' }">
      <p>Are you sure you want to delete this group? Documents will not be deleted.</p>
      <template #footer>
        <Button label="Cancel" text @click="confirmDelete = false" />
        <Button label="Delete" severity="danger" @click="deleteGroup()" />
      </template>
    </Dialog>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useDocumentGroupsStore } from '@/stores/documentGroups'
import { useRAGStore } from '@/stores/rag'
import { useAuthStore } from '@/stores/auth'
import { useRoleStore } from '@/stores/role'
import Button from 'primevue/button'
import Badge from 'primevue/badge'
import InputText from 'primevue/inputtext'
import Select from 'primevue/select'
import Dialog from 'primevue/dialog'
import Checkbox from 'primevue/checkbox'

const store = useDocumentGroupsStore()
const ragStore = useRAGStore()
const authStore = useAuthStore()
const roleStore = useRoleStore()

const groups = computed(() => store.groups)
const loading = computed(() => store.loading)
const selectedGroup = ref(null)

const showCreateDialog = ref(false)
const showEditDialog = ref(false)
const confirmDelete = ref(false)

const createForm = ref({ name: '', description: '' })
const editForm = ref({ name: '', description: '' })

const selectedCreateRoles = ref(['user'])
const selectedEditRoles = ref([])
const selectedDocToAdd = ref(null)

const currentUserId = computed(() => authStore.user?.user_id || authStore.user?._id)

const isOwner = computed(() => {
  if (!selectedGroup.value || !currentUserId.value) return false
  return selectedGroup.value.owner_id?.toString() === currentUserId.value.toString()
})

const isAdmin = computed(() => authStore.user?.roles?.includes('admin') || false)

const accessibleDocs = computed(() => store.accessibleDocs)

const availableRoles = computed(() => roleStore.roles.map(r => r.name))

const parseRoles = (roles) => {
  if (!roles) return []
  try {
    return typeof roles === 'string' ? JSON.parse(roles) : roles
  } catch {
    return []
  }
}

onMounted(async () => {
  await Promise.all([
    store.fetchGroups(),
    ragStore.listDocuments(),
    store.fetchAccessibleDocs(),
    roleStore.listRoles()
  ])
})

const selectGroup = async (group) => {
  selectedGroup.value = await store.fetchGroup(group.id)
}

const openEditDialog = () => {
  editForm.value = {
    name: selectedGroup.value.name,
    description: selectedGroup.value.description || ''
  }
  selectedEditRoles.value = parseRoles(selectedGroup.value.roles)
  showEditDialog.value = true
}

const createGroup = async () => {
  try {
    await store.createGroup(createForm.value.name, createForm.value.description, selectedCreateRoles.value)
    showCreateDialog.value = false
    createForm.value = { name: '', description: '' }
    selectedCreateRoles.value = ['user']
  } catch (error) {
    console.error('Failed to create group:', error)
  }
}

const updateGroup = async () => {
  try {
    await store.updateGroup(selectedGroup.value.id, {
      ...editForm.value,
      roles: selectedEditRoles.value
    })
    showEditDialog.value = false
  } catch (error) {
    console.error('Failed to update group:', error)
  }
}

const deleteGroup = async () => {
  try {
    await store.deleteGroup(selectedGroup.value.id)
    selectedGroup.value = null
    confirmDelete.value = false
  } catch (error) {
    console.error('Failed to delete group:', error)
  }
}

const addDocument = async () => {
  try {
    await store.addDocument(selectedGroup.value.id, selectedDocToAdd.value.id)
    selectedDocToAdd.value = null
    selectedGroup.value = await store.fetchGroup(selectedGroup.value.id)
  } catch (error) {
    console.error('Failed to add document:', error)
  }
}

const removeDocument = async (docId) => {
  try {
    await store.removeDocument(selectedGroup.value.id, docId)
    selectedGroup.value = await store.fetchGroup(selectedGroup.value.id)
  } catch (error) {
    console.error('Failed to remove document:', error)
  }
}
</script>

<style scoped>
.groups-container {
  padding: 2rem;
}

.groups-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
}

.groups-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1rem;
}

.group-card {
  background: var(--surface-card);
  border: 1px solid var(--surface-border);
  border-radius: 8px;
  padding: 1.5rem;
  cursor: pointer;
  transition: box-shadow 0.2s;
}

.group-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.group-info h3 {
  margin: 0 0 0.5rem 0;
}

.group-desc {
  color: var(--text-color-secondary);
  font-size: 0.875rem;
}

.group-meta {
  display: flex;
  gap: 0.5rem;
  align-items: center;
  margin-top: 1rem;
  flex-wrap: wrap;
}

.doc-count {
  color: var(--text-color-secondary);
  font-size: 0.75rem;
}

.group-detail {
  background: var(--surface-card);
  border: 1px solid var(--surface-border);
  border-radius: 8px;
  padding: 2rem;
  margin-top: 2rem;
}

.detail-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
}

.create-form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.create-form label {
  font-weight: 600;
  font-size: 0.875rem;
}

.documents-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.doc-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem;
  background: var(--surface-ground);
  border-radius: 4px;
}

.doc-actions {
  display: flex;
  gap: 0.25rem;
}

.add-doc-form {
  display: flex;
  gap: 0.5rem;
  padding: 1rem;
  background: var(--surface-ground);
  border-radius: 4px;
  margin-top: 1rem;
}

.loading-state, .empty-state {
  text-align: center;
  padding: 3rem;
  color: var(--text-color-secondary);
}

.role-checkboxes {
  display: flex;
  flex-wrap: wrap;
  gap: 1.25rem 2rem;
}

.role-checkbox {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  cursor: pointer;
}

.role-checkbox span {
  margin-left: 0.5rem;
}
</style>
