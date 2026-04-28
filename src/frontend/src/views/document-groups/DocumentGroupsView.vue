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
        <div v-for="group in groups" :key="group._id" class="group-card" @click="selectGroup(group)">
          <div class="group-info">
            <h3>{{ group.name }}</h3>
            <p class="group-desc">{{ group.description || 'No description' }}</p>
            <div class="group-meta">
              <Badge :value="group.visibility" :severity="getVisibilitySeverity(group.visibility)" />
              <span class="member-count">{{ getMemberCount(group) }} members</span>
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

        <Tabs :value="activeTab" @update:value="activeTab = $event">
          <TabList>
            <Tab value="members">Members</Tab>
            <Tab value="documents">Documents</Tab>
          </TabList>
          <TabPanels>
            <TabPanel value="members">
              <div class="members-list">
                <div v-for="member in selectedGroup.members" :key="member.user_id._id || member.user_id" class="member-item">
                  <span>{{ member.user_id?.username || member.user_id }}</span>
                  <Badge :value="member.role" :severity="getRoleSeverity(member.role)" />
                  <div v-if="isOwner && member.role !== 'owner'" class="member-actions">
                    <Button icon="pi pi-trash" text severity="danger" @click="removeMember(member.user_id._id || member.user_id)" />
                  </div>
                </div>
                <div v-if="isOwner" class="add-member-form">
                  <InputText v-model="newMemberId" placeholder="User ID" />
                  <Select v-model="newMemberRole" :options="['viewer', 'editor']" placeholder="Role" />
                  <Button label="Add" icon="pi pi-plus" @click="addMember()" />
                </div>
              </div>
            </TabPanel>
            <TabPanel value="documents">
              <div class="documents-list">
                <div v-for="docRef in selectedGroup.documents" :key="docRef.document_id._id || docRef.document_id" class="doc-item">
                  <span>{{ docRef.document_id?.filename || 'Unknown document' }}</span>
                  <Badge :value="docRef.document_id?.file_type" />
                  <div v-if="isOwner || isEditor" class="doc-actions">
                    <Button icon="pi pi-trash" text severity="danger" @click="removeDocument(docRef.document_id._id || docRef.document_id)" />
                  </div>
                </div>
                <div v-if="(isOwner || isEditor) && accessibleDocs.length > 0" class="add-doc-form">
                  <Select v-model="selectedDocToAdd" :options="accessibleDocs" optionLabel="filename" placeholder="Select document" />
                  <Button label="Add" icon="pi pi-plus" @click="addDocument()" />
                </div>
              </div>
            </TabPanel>
          </TabPanels>
        </Tabs>
      </div>
    </main>

    <Dialog v-model:visible="showCreateDialog" header="Create New Group" modal :style="{ width: '400px' }">
      <div class="create-form">
        <label>Name</label>
        <InputText v-model="createForm.name" placeholder="Group name" />
        <label>Description (optional)</label>
        <InputText v-model="createForm.description" placeholder="Description" />
        <label>Visibility</label>
        <Select v-model="createForm.visibility" :options="[{label: 'Private', value: 'private'}, {label: 'Team', value: 'team'}, {label: 'Public', value: 'public'}]" optionLabel="label" optionValue="value" placeholder="Visibility" />
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
        <label>Visibility</label>
        <Select v-model="editForm.visibility" :options="[{label: 'Private', value: 'private'}, {label: 'Team', value: 'team'}, {label: 'Public', value: 'public'}]" optionLabel="label" optionValue="value" />
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
import Button from 'primevue/button'
import Badge from 'primevue/badge'
import InputText from 'primevue/inputtext'
import Select from 'primevue/select'
import Dialog from 'primevue/dialog'
import Tabs from 'primevue/tabs'
import TabList from 'primevue/tablist'
import Tab from 'primevue/tab'
import TabPanels from 'primevue/tabpanels'
import TabPanel from 'primevue/tabpanel'

const store = useDocumentGroupsStore()
const ragStore = useRAGStore()
const authStore = useAuthStore()

const groups = computed(() => store.groups)
const loading = computed(() => store.loading)
const selectedGroup = ref(null)

const showCreateDialog = ref(false)
const showEditDialog = ref(false)
const confirmDelete = ref(false)
const activeTab = ref('members')

const createForm = ref({ name: '', description: '', visibility: 'private' })
const editForm = ref({ name: '', description: '', visibility: '' })

const newMemberId = ref('')
const newMemberRole = ref('viewer')
const selectedDocToAdd = ref(null)

const currentUserId = computed(() => authStore.user?.user_id || authStore.user?._id)

const isOwner = computed(() => {
  if (!selectedGroup.value || !currentUserId.value) return false
  return selectedGroup.value.owner_id?.toString() === currentUserId.value.toString()
})

const isEditor = computed(() => {
  if (!selectedGroup.value || !currentUserId.value) return false
  const member = selectedGroup.value.members?.find(m => (m.user_id?._id || m.user_id)?.toString() === currentUserId.value.toString())
  return member?.role === 'editor'
})

const accessibleDocs = computed(() => store.accessibleDocs)

onMounted(async () => {
  await store.fetchGroups()
  await ragStore.listDocuments()
  await store.fetchAccessibleDocs()
})

const getVisibilitySeverity = (visibility) => {
  const severities = { private: 'secondary', team: 'info', public: 'success' }
  return severities[visibility] || 'secondary'
}

const getRoleSeverity = (role) => {
  const severities = { owner: 'danger', editor: 'warn', viewer: 'info' }
  return severities[role] || 'info'
}

const getMemberCount = (group) => group.members?.length || 0

const selectGroup = async (group) => {
  selectedGroup.value = await store.fetchGroup(group._id)
  activeTab.value = 'members'
}

const openEditDialog = () => {
  editForm.value = {
    name: selectedGroup.value.name,
    description: selectedGroup.value.description || '',
    visibility: selectedGroup.value.visibility || 'private'
  }
  showEditDialog.value = true
}

const createGroup = async () => {
  try {
    await store.createGroup(createForm.value.name, createForm.value.description, createForm.value.visibility)
    showCreateDialog.value = false
    createForm.value = { name: '', description: '', visibility: 'private' }
  } catch (error) {
    console.error('Failed to create group:', error)
  }
}

const updateGroup = async () => {
  try {
    await store.updateGroup(selectedGroup.value._id, editForm.value)
    showEditDialog.value = false
  } catch (error) {
    console.error('Failed to update group:', error)
  }
}

const deleteGroup = async () => {
  try {
    await store.deleteGroup(selectedGroup.value._id)
    selectedGroup.value = null
    confirmDelete.value = false
  } catch (error) {
    console.error('Failed to delete group:', error)
  }
}

const addMember = async () => {
  try {
    await store.addMember(selectedGroup.value._id, newMemberId.value, newMemberRole.value)
    newMemberId.value = ''
    selectedGroup.value = await store.fetchGroup(selectedGroup.value._id)
  } catch (error) {
    console.error('Failed to add member:', error)
  }
}

const removeMember = async (userId) => {
  try {
    await store.removeMember(selectedGroup.value._id, userId)
    selectedGroup.value = await store.fetchGroup(selectedGroup.value._id)
  } catch (error) {
    console.error('Failed to remove member:', error)
  }
}

const addDocument = async () => {
  try {
    await store.addDocument(selectedGroup.value._id, selectedDocToAdd.value._id)
    selectedDocToAdd.value = null
    selectedGroup.value = await store.fetchGroup(selectedGroup.value._id)
  } catch (error) {
    console.error('Failed to add document:', error)
  }
}

const removeDocument = async (docId) => {
  try {
    await store.removeDocument(selectedGroup.value._id, docId)
    selectedGroup.value = await store.fetchGroup(selectedGroup.value._id)
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
}

.member-count, .doc-count {
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

.members-list, .documents-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.member-item, .doc-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem;
  background: var(--surface-ground);
  border-radius: 4px;
}

.member-actions, .doc-actions {
  display: flex;
  gap: 0.25rem;
}

.add-member-form, .add-doc-form {
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
</style>
