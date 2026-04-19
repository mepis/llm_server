<template>
  <div class="skills-view">
    <Toast />
    <div class="page-header">
      <h1>Skills</h1>
      <Button
        v-if="skillStore.hasAdminRole"
        label="New Skill"
        icon="pi pi-plus"
        @click="openCreateDialog"
      />
    </div>

    <div v-if="skillStore.error" class="error-banner">
      {{ skillStore.error }}
    </div>

    <div v-if="skillStore.loading" class="loading">Loading skills...</div>

    <div v-else class="skills-grid">
      <div v-for="skill in skillStore.skills" :key="skill.name" class="skill-card">
        <div class="skill-card-header">
          <h3>{{ skill.name }}</h3>
        </div>

        <p class="skill-description">{{ skill.description }}</p>

        <div class="skill-roles">
          <span v-for="role in (skill.roles || ['user'])" :key="role" class="role-badge">{{ role }}</span>
        </div>

        <div v-if="skill.tools" class="skill-tools">
          <h4>Tools</h4>
          <span class="tools-list">{{ skill.tools }}</span>
        </div>

        <div class="skill-location">
          <span class="location-label">Location:</span>
          <span class="location-value">{{ skill.location }}</span>
        </div>

        <div class="skill-actions">
          <Button
            label="View Content"
            icon="pi pi-eye"
            outlined
            @click="openViewDialog(skill)"
          />
          <Button
            v-if="skillStore.hasAdminRole"
            label="Edit"
            icon="pi pi-pencil"
            outlined
            @click="openEditDialog(skill)"
          />
          <Button
            v-if="skillStore.hasAdminRole"
            label="Delete"
            icon="pi pi-trash"
            severity="danger"
            outlined
            @click="confirmDelete(skill)"
          />
        </div>
      </div>

      <div v-if="skillStore.skills.length === 0" class="empty-state">
        <p>No skills found. Create your first skill to get started.</p>
      </div>
    </div>

    <!-- Create/Edit Dialog -->
    <Dialog
      v-model:visible="dialogVisible"
      :header="isEditing ? 'Edit Skill' : 'Create Skill'"
      modal
      class="skill-dialog"
      :style="{ width: '700px' }"
    >
      <div class="dialog-form">
        <div class="form-field">
          <label>Name</label>
          <InputText v-model="skillForm.name" placeholder="skill-name" :disabled="isEditing" />
        </div>
        <div class="form-field">
          <label>Description</label>
          <InputText v-model="skillForm.description" placeholder="Brief description of what this skill does" />
        </div>
        <div class="form-field">
          <label>Roles</label>
          <div class="role-checkboxes">
            <label v-for="role in availableRoles" :key="role" class="role-checkbox">
              <Checkbox v-model="selectedRoles" inputId="role-{{ role }}" :value="role" />
              <span>{{ role }}</span>
            </label>
          </div>
        </div>
        <div class="form-field">
          <label>Tools (comma-separated)</label>
          <InputText v-model="skillForm.tools" placeholder="Read, Write, Edit, Bash, Glob, Grep" />
        </div>
        <div class="form-field">
          <label>Model</label>
          <InputText v-model="skillForm.model" placeholder="sonnet" />
        </div>
        <div class="form-field">
          <label>Content (Markdown)</label>
          <Textarea v-model="skillForm.content" class="content-textarea" placeholder="# Skill instructions..." rows="15" />
        </div>
      </div>
      <template #footer>
        <Button label="Cancel" outlined @click="dialogVisible = false" />
        <Button label="Save" @click="saveSkill" :disabled="skillStore.loading" />
      </template>
    </Dialog>

    <!-- View Dialog -->
    <Dialog
      v-model:visible="viewDialogVisible"
      :header="'Skill: ' + (selectedSkill?.name || '')"
      modal
      class="view-dialog"
      :style="{ width: '700px' }"
    >
      <div v-if="selectedSkill" class="view-content">
        <div class="view-meta">
          <div class="meta-row">
            <strong>Name:</strong> {{ selectedSkill.name }}
          </div>
          <div class="meta-row">
            <strong>Description:</strong> {{ selectedSkill.description }}
          </div>
          <div class="meta-row">
            <strong>Roles:</strong>
            <span class="role-badge" v-for="role in (selectedSkill.roles || ['user'])" :key="role">{{ role }}</span>
          </div>
          <div v-if="selectedSkill.tools" class="meta-row">
            <strong>Tools:</strong> {{ selectedSkill.tools }}
          </div>
          <div class="meta-row">
            <strong>Location:</strong>
            <span class="location-value">{{ selectedSkill.location }}</span>
          </div>
        </div>
        <div class="view-body">
          <pre>{{ selectedSkill.content }}</pre>
        </div>
      </div>
      <template #footer>
        <Button label="Close" outlined @click="viewDialogVisible = false" />
      </template>
    </Dialog>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue';
import { useSkillStore } from '@/stores/skill';
import { useToast } from 'primevue/usetoast';
import Toast from 'primevue/toast';

const skillStore = useSkillStore();
const toast = useToast();

const dialogVisible = ref(false);
const viewDialogVisible = ref(false);
const isEditing = ref(false);
const selectedSkill = ref(null);

const availableRoles = ['user', 'admin', 'system'];

const skillForm = reactive({
  name: '',
  description: '',
  content: '',
  roles: [],
  tools: '',
  model: '',
});

const selectedRoles = ref([]);

const initSkillForm = () => {
  skillForm.name = '';
  skillForm.description = '';
  skillForm.content = '';
  skillForm.roles = ['user'];
  skillForm.tools = '';
  skillForm.model = '';
  selectedRoles.value = ['user'];
};

const openCreateDialog = () => {
  isEditing.value = false;
  selectedSkill.value = null;
  initSkillForm();
  dialogVisible.value = true;
};

const openEditDialog = (skill) => {
  isEditing.value = true;
  selectedSkill.value = skill;
  skillForm.name = skill.name;
  skillForm.description = skill.description;
  skillForm.content = skill.content;
  skillForm.tools = skill.tools || '';
  skillForm.model = skill.model || '';
  skillForm.roles = skill.roles || ['user'];
  selectedRoles.value = [...(skill.roles || ['user'])];
  dialogVisible.value = true;
};

const openViewDialog = (skill) => {
  selectedSkill.value = skill;
  viewDialogVisible.value = true;
};

const saveSkill = async () => {
  try {
    const data = {
      name: skillForm.name,
      description: skillForm.description,
      content: skillForm.content,
      roles: selectedRoles.value,
      tools: skillForm.tools || null,
      model: skillForm.model || null,
    };

    if (isEditing.value && selectedSkill.value) {
      await skillStore.updateSkill(selectedSkill.value.name, data);
      toast.add({ severity: 'success', summary: 'Success', detail: 'Skill updated' });
    } else {
      await skillStore.createSkill(data);
      toast.add({ severity: 'success', summary: 'Success', detail: 'Skill created' });
    }

    dialogVisible.value = false;
    await skillStore.listSkills();
  } catch (error) {
    toast.add({ severity: 'error', summary: 'Error', detail: error.response?.data?.error || 'Failed to save skill' });
  }
};

const confirmDelete = async (skill) => {
  if (!confirm(`Delete "${skill.name}"?`)) return;
  try {
    await skillStore.deleteSkill(skill.name);
    toast.add({ severity: 'success', summary: 'Success', detail: 'Skill deleted' });
    await skillStore.listSkills();
  } catch (error) {
    toast.add({ severity: 'error', summary: 'Error', detail: error.response?.data?.error || 'Failed to delete skill' });
  }
};

skillStore.listSkills();
</script>

<style scoped>
.skills-view {
  padding: 2rem;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
}

.page-header h1 {
  margin: 0;
}

.error-banner {
  background: #fee2e2;
  color: #991b1b;
  padding: 1rem;
  border-radius: 8px;
  margin-bottom: 1rem;
}

.loading {
  text-align: center;
  padding: 2rem;
}

.skills-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 1.5rem;
}

.skill-card {
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.skill-card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
}

.skill-card-header h3 {
  margin: 0;
}

.skill-description {
  color: #666;
  margin: 0.5rem 0;
}

.skill-roles {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 0.75rem;
}

.role-badge {
  background: #e0e7ff;
  color: #4338ca;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-size: 0.75rem;
}

.skill-tools {
  margin-bottom: 0.75rem;
}

.skill-tools h4 {
  margin: 0 0 0.25rem 0;
  font-size: 0.875rem;
}

.tools-list {
  font-size: 0.875rem;
  color: #374151;
}

.skill-location {
  font-size: 0.75rem;
  color: #9ca3af;
  margin-bottom: 1rem;
  word-break: break-all;
}

.location-label {
  font-weight: 500;
}

.skill-actions {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.empty-state {
  grid-column: 1 / -1;
  text-align: center;
  padding: 3rem;
  color: #666;
}

.dialog-form,
.view-content {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.form-field label {
  display: block;
  margin-bottom: 0.25rem;
  font-weight: 500;
}

.content-textarea {
  font-family: monospace;
  width: 100%;
  min-height: 200px;
  resize: vertical;
}

.role-checkboxes {
  display: flex;
  gap: 1rem;
}

.role-checkbox {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.view-meta {
  background: #f9fafb;
  padding: 1rem;
  border-radius: 8px;
  margin-bottom: 1rem;
}

.meta-row {
  margin-bottom: 0.5rem;
  font-size: 0.875rem;
}

.meta-row:last-child {
  margin-bottom: 0;
}

.meta-row strong {
  margin-right: 0.5rem;
}

.view-body pre {
  background: #f9fafb;
  padding: 1rem;
  border-radius: 8px;
  white-space: pre-wrap;
  word-break: break-word;
  font-size: 0.875rem;
  max-height: 400px;
  overflow-y: auto;
}

.location-value {
  font-family: monospace;
  font-size: 0.75rem;
  color: #6b7280;
}
</style>
