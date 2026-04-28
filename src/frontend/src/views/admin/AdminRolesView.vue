<template>
  <div class="admin-container">
    <main class="admin-main">
      <Toast />

      <div class="admin-header">
        <h1>Role Management</h1>
        <Button label="Add Role" icon="pi pi-plus" @click="openCreateDialog" />
      </div>

      <div v-if="roleStore.error" class="error-banner">
        {{ roleStore.error }}
      </div>

      <div class="roles-table-wrapper">
        <DataTable
          :value="filteredRoles"
          :paginator="true"
          :rows="10"
          :totalRecords="filteredRoles.length"
          responsiveLayout="scroll"
          class="roles-table"
        >
          <Column field="name" header="Name" :sortable="true">
            <template #body="slotData">
              <span class="name-cell">{{ slotData.data.name }}</span>
            </template>
          </Column>

          <Column field="description" header="Description" :sortable="true">
            <template #body="slotData">
              <span class="desc-cell">{{ slotData.data.description || '-' }}</span>
            </template>
          </Column>

          <Column field="is_builtin" header="Type">
            <template #body="slotData">
              <span :class="['type-badge', slotData.data.is_builtin ? 'type-builtin' : 'type-custom']">
                {{ slotData.data.is_builtin ? 'Built-in' : 'Custom' }}
              </span>
            </template>
          </Column>

          <Column field="createdAt" header="Created">
            <template #body="slotData">
              <span class="date-cell">{{ formatDate(slotData.data.createdAt) }}</span>
            </template>
          </Column>

          <Column header="Actions" :exportable="false" style="min-width: 120px">
            <template #body="slotData">
              <div class="action-buttons">
                <Button
                  v-if="!slotData.data.is_builtin"
                  icon="pi pi-trash"
                  severity="danger"
                  outlined
                  text
                  size="small"
                  @click="confirmDelete(slotData.data)"
                  title="Delete role"
                />
              </div>
            </template>
          </Column>
        </DataTable>

        <div v-if="filteredRoles.length === 0" class="empty-state">
          <p>No roles found.</p>
        </div>
      </div>

      <!-- Create Role Dialog -->
      <Dialog
        v-model:visible="createDialogVisible"
        header="Create Role"
        modal
        :style="{ width: '450px' }"
      >
        <div class="dialog-form">
          <div class="form-field">
            <label>Name <span class="required">*</span></label>
            <InputText v-model="createForm.name" placeholder="Enter role name" />
          </div>
          <div class="form-field">
            <label>Description</label>
            <InputText v-model="createForm.description" placeholder="Enter description (optional)" />
          </div>
        </div>
        <template #footer>
          <Button label="Cancel" outlined @click="createDialogVisible = false" />
          <Button
            label="Create"
            @click="createRole"
            :disabled="roleStore.loading"
          />
        </template>
      </Dialog>

      <!-- Delete Confirmation Dialog -->
      <Dialog
        v-model:visible="deleteDialogVisible"
        header="Confirm Delete"
        modal
        :style="{ width: '400px' }"
      >
        <p class="delete-message">
          Are you sure you want to delete role
          <strong>"{{ deleteRoleTarget?.name }}"</strong>? This action cannot be undone and users with this role may be affected.
        </p>
        <template #footer>
          <Button label="Cancel" outlined @click="deleteDialogVisible = false" />
          <Button
            label="Delete"
            severity="danger"
            @click="deleteRole"
            :disabled="roleStore.loading"
          />
        </template>
      </Dialog>
    </main>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoleStore } from '@/stores/role'
import { useToast } from 'primevue/usetoast'
import Toast from 'primevue/toast'
import Button from 'primevue/button'
import Dialog from 'primevue/dialog'
import InputText from 'primevue/inputtext'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'

const roleStore = useRoleStore()
const toast = useToast()

const searchQuery = ref('')

// Create form
const createDialogVisible = ref(false)
const createForm = ref({
  name: '',
  description: ''
})

// Delete dialog
const deleteDialogVisible = ref(false)
const deleteRoleTarget = ref(null)

const filteredRoles = computed(() => {
  if (!searchQuery.value) return roleStore.roles
  const query = searchQuery.value.toLowerCase()
  return roleStore.roles.filter(r =>
    r.name.toLowerCase().includes(query) ||
    (r.description && r.description.toLowerCase().includes(query))
  )
})

const formatDate = (dateStr) => {
  if (!dateStr) return 'NA'
  const date = new Date(dateStr)
  if (isNaN(date.getTime())) return 'NA'
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}

const loadRoles = async () => {
  try {
    await roleStore.listRoles()
  } catch (error) {
    toast.add({ severity: 'error', summary: 'Error', detail: 'Failed to load roles', life: 2000 })
  }
}

const openCreateDialog = () => {
  createForm.value = {
    name: '',
    description: ''
  }
  createDialogVisible.value = true
}

const createRole = async () => {
  if (!createForm.value.name) {
    toast.add({ severity: 'warn', summary: 'Validation Error', detail: 'Role name is required', life: 2000 })
    return
  }

  try {
    await roleStore.createRole({
      name: createForm.value.name,
      description: createForm.value.description
    })
    toast.add({ severity: 'success', summary: 'Success', detail: `Role "${createForm.value.name}" created`, life: 2000 })
    createDialogVisible.value = false
  } catch (error) {
    toast.add({ severity: 'error', summary: 'Error', detail: error.response?.data?.error || 'Failed to create role', life: 2000 })
  }
}

const confirmDelete = (role) => {
  deleteRoleTarget.value = role
  deleteDialogVisible.value = true
}

const deleteRole = async () => {
  try {
    await roleStore.deleteRole(deleteRoleTarget.value.name)
    toast.add({ severity: 'success', summary: 'Success', detail: `Role "${deleteRoleTarget.value.name}" deleted`, life: 2000 })
    deleteDialogVisible.value = false
  } catch (error) {
    toast.add({ severity: 'error', summary: 'Error', detail: error.response?.data?.error || 'Failed to delete role', life: 2000 })
  }
}

onMounted(() => {
  loadRoles()
})
</script>

<style scoped>
.admin-container {
  display: flex;
  flex-direction: column;
  height: 100vh;
}

.admin-main {
  flex: 1;
  padding: 2rem;
  background: #f9fafb;
  overflow-y: auto;
}

.admin-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
}

.admin-header h1 {
  font-size: 1.875rem;
  color: #111827;
  margin: 0;
}

.error-banner {
  background: #fee2e2;
  color: #991b1b;
  padding: 1rem;
  border-radius: 8px;
  margin-bottom: 1rem;
}

.roles-table-wrapper {
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

.loading-state {
  text-align: center;
  padding: 3rem;
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.empty-state {
  text-align: center;
  padding: 3rem;
  color: #6b7280;
}

.name-cell {
  font-weight: 600;
  color: #1f2937;
}

.desc-cell {
  color: #6b7280;
}

.type-badge {
  padding: 0.25rem 0.65rem;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 500;
}

.type-builtin {
  background: #d1fae5;
  color: #065f46;
}

.type-custom {
  background: #eff6ff;
  color: #2563eb;
}

.date-cell {
  color: #6b7280;
  font-size: 0.875rem;
}

.action-buttons {
  display: flex;
  gap: 0.25rem;
}

.dialog-form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.form-field label {
  display: block;
  margin-bottom: 0.25rem;
  font-weight: 500;
  color: #374151;
}

.required {
  color: #ef4444;
}

.delete-message {
  color: #374151;
  line-height: 1.6;
  margin: 0;
}

@media (max-width: 768px) {
  .admin-main {
    padding: 1rem;
  }

  .admin-header {
    flex-direction: column;
    gap: 1rem;
    align-items: flex-start;
  }
}
</style>
