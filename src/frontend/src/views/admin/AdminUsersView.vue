<template>
  <div class="admin-container">
    <main class="admin-main">
      <Toast />

      <div class="admin-header">
        <h1>User Management</h1>
        <Button label="Add User" icon="pi pi-plus" @click="openCreateDialog" />
      </div>

      <div v-if="userStore.error" class="error-banner">
        {{ userStore.error }}
      </div>

      <div class="search-bar">
        <InputText
          v-model="searchQuery"
          placeholder="Search by username or email..."
          class="search-input"
        />
        <Button
          label="Refresh"
          icon="pi pi-refresh"
          outlined
          @click="loadUsers"
          :disabled="userStore.loading"
        />
      </div>

      <div v-if="userStore.loading && userStore.users.length === 0" class="loading-state">
        <p>Loading users...</p>
      </div>

      <div v-else class="users-table-wrapper">
        <DataTable
          :value="filteredUsers"
          :paginator="true"
          :rows="10"
          :totalRecords="filteredUsers.length"
          responsiveLayout="scroll"
          class="users-table"
        >
          <Column field="username" header="Username" :sortable="true">
            <template #body="slotData">
              <span class="username-cell">{{ slotData.data.username }}</span>
            </template>
          </Column>

          <Column field="email" header="Email" :sortable="true">
            <template #body="slotData">
              <span class="email-cell">{{ slotData.data.email }}</span>
            </template>
          </Column>

          <Column field="roles" header="Roles">
            <template #body="slotData">
              <div class="roles-cell">
                <span
                  v-for="role in slotData.data.roles"
                  :key="role"
                  :class="['role-tag', `role-${role}`]"
                >
                  {{ role }}
                </span>
              </div>
            </template>
          </Column>

          <Column field="is_active" header="Status">
            <template #body="slotData">
              <span :class="['status-badge', slotData.data.is_active ? 'status-active' : 'status-inactive']">
                {{ slotData.data.is_active ? 'Active' : 'Inactive' }}
              </span>
            </template>
          </Column>

          <Column field="created_at" header="Created">
            <template #body="slotData">
              <span class="date-cell">{{ formatDate(slotData.data.created_at) }}</span>
            </template>
          </Column>

          <Column header="Actions" :exportable="false" style="min-width: 200px">
            <template #body="slotData">
              <div class="action-buttons">
                <Button
                  icon="pi pi-pencil"
                  outlined
                  text
                  size="small"
                  @click="openEditDialog(slotData.data)"
                  title="Edit user"
                />
                <Button
                  icon="pi pi-key"
                  outlined
                  text
                  size="small"
                  @click="openRoleDialog(slotData.data)"
                  title="Manage roles"
                />
                <Button
                  icon="pi pi-lock"
                  severity="warning"
                  outlined
                  text
                  size="small"
                  @click="openResetPasswordDialog(slotData.data)"
                  title="Reset password"
                />
                <Button
                  icon="pi pi-trash"
                  severity="danger"
                  outlined
                  text
                  size="small"
                  @click="confirmDelete(slotData.data)"
                  title="Delete user"
                />
              </div>
            </template>
          </Column>
        </DataTable>

        <div v-if="filteredUsers.length === 0" class="empty-state">
          <p>No users found.</p>
        </div>
      </div>

      <!-- Create User Dialog -->
      <Dialog
        v-model:visible="createDialogVisible"
        header="Create User"
        modal
        :style="{ width: '450px' }"
      >
        <div class="dialog-form">
          <div class="form-field">
            <label>Username <span class="required">*</span></label>
            <InputText v-model="createForm.username" placeholder="Enter username" />
          </div>
          <div class="form-field">
            <label>Email <span class="required">*</span></label>
            <InputText v-model="createForm.email" placeholder="Enter email" type="email" />
          </div>
          <div class="form-field">
            <label>Password <span class="required">*</span></label>
            <InputText v-model="createForm.password" placeholder="Enter password" type="password" />
          </div>
          <div class="form-field">
            <label>Confirm Password <span class="required">*</span></label>
            <InputText v-model="createForm.confirmPassword" placeholder="Confirm password" type="password" />
          </div>
          <div class="form-field">
            <label>Roles</label>
            <div class="role-checkboxes">
              <label v-for="role in availableRoles" :key="role" class="role-checkbox">
                <Checkbox v-model="selectedCreateRoles" :value="role" inputId="create-role-{{ role }}" />
                <span>{{ role }}</span>
              </label>
            </div>
          </div>
          <div class="form-field">
            <label>
              <Checkbox v-model="createForm.isActive" inputId="create-is-active" :binary="true" />
              Active
            </label>
          </div>
        </div>
        <template #footer>
          <Button label="Cancel" outlined @click="createDialogVisible = false" />
          <Button
            label="Create"
            @click="createUser"
            :disabled="userStore.loading"
          />
        </template>
      </Dialog>

      <!-- Edit User Dialog -->
      <Dialog
        v-model:visible="editDialogVisible"
        header="Edit User"
        modal
        :style="{ width: '450px' }"
      >
        <div class="dialog-form">
          <div class="form-field">
            <label>Username</label>
            <InputText :value="editForm.username" disabled />
          </div>
          <div class="form-field">
            <label>Display Name</label>
            <InputText v-model="editForm.displayName" placeholder="Enter display name (optional)" />
          </div>
          <div class="form-field">
            <label>Email <span class="required">*</span></label>
            <InputText v-model="editForm.email" placeholder="Enter email" type="email" />
          </div>
          <div class="form-field">
            <label>Matrix Username</label>
            <InputText v-model="editForm.matrixUsername" placeholder="@username:server.domain" />
          </div>
          <div class="form-field">
            <label>
              <Checkbox v-model="editForm.isActive" inputId="edit-is-active" :binary="true" />
              Active
            </label>
          </div>
        </div>
        <template #footer>
          <Button label="Cancel" outlined @click="editDialogVisible = false" />
          <Button
            label="Save"
            @click="saveEditUser"
            :disabled="userStore.loading"
          />
        </template>
      </Dialog>

      <!-- Role Management Dialog -->
      <Dialog
        v-model:visible="roleDialogVisible"
        header="Manage Roles"
        modal
        :style="{ width: '450px' }"
      >
        <div v-if="selectedUser" class="role-dialog-content">
          <div class="user-info">
            <span class="user-name">{{ selectedUser.username }}</span>
            <span class="user-email">{{ selectedUser.email }}</span>
          </div>

          <div class="form-field">
            <label>Current Roles</label>
            <div class="current-roles">
              <span
                v-for="role in selectedUser.roles"
                :key="role"
                :class="['role-tag', `role-${role}`, 'removable']"
              >
                {{ role }}
                <button class="remove-role-btn" @click="removeUserRole(role)" title="Remove role">
                  &times;
                </button>
              </span>
            </div>
          </div>

          <div class="form-field">
            <label>Add Role</label>
            <div class="add-role-row">
              <Dropdown
                v-model="selectedRoleToAdd"
                :options="availableRoles.filter(r => !selectedUser.roles.includes(r))"
                placeholder="Select a role"
                class="role-dropdown"
              />
              <Button
                label="Add"
                icon="pi pi-plus"
                @click="addSelectedRole"
                :disabled="!selectedRoleToAdd || userStore.loading"
              />
            </div>
          </div>
        </div>
        <template #footer>
          <Button label="Close" outlined @click="roleDialogVisible = false" />
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
          Are you sure you want to delete user
          <strong>"{{ deleteUserTarget?.username }}"</strong>? This action cannot be undone.
        </p>
        <template #footer>
          <Button label="Cancel" outlined @click="deleteDialogVisible = false" />
          <Button
            label="Delete"
            severity="danger"
            @click="deleteUser"
            :disabled="userStore.loading"
          />
        </template>
      </Dialog>

      <!-- Reset Password Dialog -->
      <Dialog
        v-model:visible="resetPasswordDialogVisible"
        header="Reset Password"
        modal
        :style="{ width: '450px' }"
      >
        <div v-if="resetPasswordTarget" class="dialog-form">
          <p class="reset-password-info">
            Reset password for user
            <strong>"{{ resetPasswordTarget.username }}"</strong>
            (<span>{{ resetPasswordTarget.email }}</span>)
          </p>
          <div class="form-field">
            <label>New Password <span class="required">*</span></label>
            <InputText v-model="resetPasswordForm.password" placeholder="Enter new password" type="password" />
          </div>
          <div class="form-field">
            <label>Confirm Password <span class="required">*</span></label>
            <InputText v-model="resetPasswordForm.confirmPassword" placeholder="Confirm new password" type="password" />
          </div>
        </div>
        <template #footer>
          <Button label="Cancel" outlined @click="resetPasswordDialogVisible = false" />
          <Button
            label="Reset Password"
            severity="warning"
            @click="resetPassword"
            :disabled="userStore.loading"
          />
        </template>
      </Dialog>
    </main>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useUserStore } from '@/stores/user'
import { useRoleStore } from '@/stores/role'
import { useToast } from 'primevue/usetoast'
import Toast from 'primevue/toast'
import Button from 'primevue/button'
import Dialog from 'primevue/dialog'
import InputText from 'primevue/inputtext'
import Checkbox from 'primevue/checkbox'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import Dropdown from 'primevue/dropdown'

const userStore = useUserStore()
const roleStore = useRoleStore()
const toast = useToast()

const searchQuery = ref('')
const availableRoles = computed(() => roleStore.roles.map(r => r.name))

// Create form
const createDialogVisible = ref(false)
const createForm = ref({
  username: '',
  email: '',
  password: '',
  confirmPassword: '',
  isActive: true
})
const selectedCreateRoles = ref(['user'])

// Edit form
const editDialogVisible = ref(false)
const editingUserId = ref(null)
const editForm = ref({
  username: '',
  displayName: '',
  email: '',
  matrixUsername: '',
  isActive: true
})

// Role dialog
const roleDialogVisible = ref(false)
const selectedUser = ref(null)
const selectedRoleToAdd = ref(null)

// Delete dialog
const deleteDialogVisible = ref(false)
const deleteUserTarget = ref(null)

// Reset password dialog
const resetPasswordDialogVisible = ref(false)
const resetPasswordTarget = ref(null)
const resetPasswordForm = ref({
  password: '',
  confirmPassword: ''
})

const filteredUsers = computed(() => {
  if (!searchQuery.value) return userStore.users
  const query = searchQuery.value.toLowerCase()
  return userStore.users.filter(u =>
    u.username.toLowerCase().includes(query) ||
    u.email.toLowerCase().includes(query)
  )
})

const formatDate = (dateStr) => {
  const date = new Date(dateStr)
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
    console.error('Failed to load roles:', error)
  }
}

const loadUsers = async () => {
  try {
    await userStore.listUsers()
  } catch (error) {
    toast.add({ severity: 'error', summary: 'Error', detail: 'Failed to load users', life: 2000 })
  }
}

const openCreateDialog = () => {
  createForm.value = {
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    isActive: true
  }
  selectedCreateRoles.value = ['user']
  createDialogVisible.value = true
}

const createUser = async () => {
  if (!createForm.value.username || !createForm.value.email || !createForm.value.password) {
    toast.add({ severity: 'warn', summary: 'Validation Error', detail: 'Username, email, and password are required', life: 2000 })
    return
  }
  if (createForm.value.password !== createForm.value.confirmPassword) {
    toast.add({ severity: 'warn', summary: 'Validation Error', detail: 'Passwords do not match', life: 2000 })
    return
  }
  if (selectedCreateRoles.value.length === 0) {
    toast.add({ severity: 'warn', summary: 'Validation Error', detail: 'At least one role is required', life: 2000 })
    return
  }

  try {
    await userStore.createUser({
      username: createForm.value.username,
      email: createForm.value.email,
      password: createForm.value.password,
      roles: selectedCreateRoles.value,
      is_active: createForm.value.isActive
    })
    toast.add({ severity: 'success', summary: 'Success', detail: 'User created successfully', life: 2000 })
    createDialogVisible.value = false
  } catch (error) {
    toast.add({ severity: 'error', summary: 'Error', detail: error.response?.data?.error || 'Failed to create user', life: 2000 })
  }
}

const openEditDialog = (user) => {
  editingUserId.value = user.id
  editForm.value = {
    username: user.username,
    displayName: user.display_name || '',
    email: user.email,
    matrixUsername: user.matrix_username || '',
    isActive: user.is_active
  }
  editDialogVisible.value = true
}

const saveEditUser = async () => {
  if (!editForm.value.email) {
    toast.add({ severity: 'warn', summary: 'Validation Error', detail: 'Email is required', life: 2000 })
    return
  }

  try {
    await userStore.updateUser(editingUserId.value, {
      email: editForm.value.email,
      display_name: editForm.value.displayName || null,
      matrix_username: editForm.value.matrixUsername || null,
      is_active: editForm.value.isActive
    })
    toast.add({ severity: 'success', summary: 'Success', detail: 'User updated successfully', life: 2000 })
    editDialogVisible.value = false
    await loadUsers()
  } catch (error) {
    toast.add({ severity: 'error', summary: 'Error', detail: error.response?.data?.error || 'Failed to update user', life: 2000 })
  }
}

const openRoleDialog = (user) => {
  selectedUser.value = { ...user }
  selectedRoleToAdd.value = null
  roleDialogVisible.value = true
}

const refreshSelectedUser = () => {
  if (!selectedUser.value) return
  const updated = userStore.users.find(u => u.id === selectedUser.value.id)
  if (updated) {
    selectedUser.value = { ...updated }
  }
}

const addSelectedRole = async () => {
  if (!selectedRoleToAdd.value || !selectedUser.value) return

  try {
    await userStore.addRole(selectedUser.value.id, selectedRoleToAdd.value)
    toast.add({ severity: 'success', summary: 'Success', detail: `Role "${selectedRoleToAdd.value}" added`, life: 2000 })
    selectedRoleToAdd.value = null
    await loadUsers()
    refreshSelectedUser()
  } catch (error) {
    toast.add({ severity: 'error', summary: 'Error', detail: error.response?.data?.error || 'Failed to add role', life: 2000 })
  }
}

const removeUserRole = async (role) => {
  if (!selectedUser.value) return

  try {
    await userStore.removeRole(selectedUser.value.id, role)
    toast.add({ severity: 'success', summary: 'Success', detail: `Role "${role}" removed`, life: 2000 })
    await loadUsers()
    refreshSelectedUser()
  } catch (error) {
    toast.add({ severity: 'error', summary: 'Error', detail: error.response?.data?.error || 'Failed to remove role', life: 2000 })
  }
}

const confirmDelete = (user) => {
  deleteUserTarget.value = user
  deleteDialogVisible.value = true
}

const deleteUser = async () => {
  try {
    await userStore.deleteUser(deleteUserTarget.value.id)
    toast.add({ severity: 'success', summary: 'Success', detail: 'User deleted successfully', life: 2000 })
    deleteDialogVisible.value = false
  } catch (error) {
    toast.add({ severity: 'error', summary: 'Error', detail: error.response?.data?.error || 'Failed to delete user', life: 2000 })
  }
}

const openResetPasswordDialog = (user) => {
  resetPasswordTarget.value = user
  resetPasswordForm.value = {
    password: '',
    confirmPassword: ''
  }
  resetPasswordDialogVisible.value = true
}

const resetPassword = async () => {
  if (!resetPasswordForm.value.password) {
    toast.add({ severity: 'warn', summary: 'Validation Error', detail: 'Password is required', life: 2000 })
    return
  }
  if (resetPasswordForm.value.password !== resetPasswordForm.value.confirmPassword) {
    toast.add({ severity: 'warn', summary: 'Validation Error', detail: 'Passwords do not match', life: 2000 })
    return
  }

  try {
    await userStore.resetPassword(resetPasswordTarget.value.id, resetPasswordForm.value.password)
    toast.add({ severity: 'success', summary: 'Success', detail: `Password reset for "${resetPasswordTarget.value.username}"`, life: 3000 })
    resetPasswordDialogVisible.value = false
  } catch (error) {
    toast.add({ severity: 'error', summary: 'Error', detail: error.response?.data?.error || 'Failed to reset password', life: 2000 })
  }
}

onMounted(() => {
  loadRoles()
  loadUsers()
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

.search-bar {
  display: flex;
  gap: 0.75rem;
  margin-bottom: 1.5rem;
}

.search-input {
  flex: 1;
}

.users-table-wrapper {
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

.username-cell {
  font-weight: 600;
  color: #1f2937;
}

.email-cell {
  color: #6b7280;
}

.roles-cell {
  display: flex;
  gap: 0.35rem;
  flex-wrap: wrap;
}

.role-tag {
  padding: 0.2rem 0.6rem;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 500;
}

.role-user {
  background: #eff6ff;
  color: #2563eb;
}

.role-admin {
  background: #fff7ed;
  color: #ea580c;
}

.role-system {
  background: #f3e8ff;
  color: #9333ea;
}

.status-badge {
  padding: 0.25rem 0.65rem;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 500;
}

.status-active {
  background: #d1fae5;
  color: #065f46;
}

.status-inactive {
  background: #fee2e2;
  color: #991b1b;
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

.role-checkboxes {
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
}

.role-checkbox {
  display: flex;
  align-items: center;
  gap: 0.35rem;
  font-weight: 400;
  cursor: pointer;
}

.role-dialog-content {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.user-info {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  padding-bottom: 0.75rem;
  border-bottom: 1px solid #e5e7eb;
}

.user-name {
  font-weight: 600;
  font-size: 1.1rem;
  color: #1f2937;
}

.user-email {
  color: #6b7280;
  font-size: 0.875rem;
}

.current-roles {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
  min-height: 32px;
}

.removable {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  position: relative;
  padding-right: 0.4rem;
}

.remove-role-btn {
  background: none;
  border: none;
  color: inherit;
  cursor: pointer;
  font-size: 1rem;
  line-height: 1;
  padding: 0;
  opacity: 0.6;
  transition: opacity 0.2s;
}

.remove-role-btn:hover {
  opacity: 1;
}

.add-role-row {
  display: flex;
  gap: 0.5rem;
  align-items: center;
}

.role-dropdown {
  flex: 1;
}

.delete-message {
  color: #374151;
  line-height: 1.6;
  margin: 0;
}

.reset-password-info {
  color: #374151;
  line-height: 1.6;
  margin: 0 0 1rem;
}

.reset-password-info strong {
  color: #1f2937;
}

.reset-password-info span {
  color: #6b7280;
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

  .search-bar {
    flex-direction: column;
  }

  .add-role-row {
    flex-direction: column;
  }

  .role-dropdown {
    width: 100%;
  }
}
</style>
