<template>
  <div class="edit-skill-container">
    <main class="edit-skill-main">
      <Toast :life="4000" />
      <div class="edit-skill-header">
        <div class="header-left">
          <Button icon="pi pi-arrow-left" outlined severity="secondary" @click="$router.push('/skills')" class="back-btn" />
          <h1>{{ isEditing ? 'Edit Skill' : 'Create Skill' }}</h1>
        </div>
        <div class="header-actions">
          <Button label="Cancel" outlined @click="$router.push('/skills')" />
          <Button label="Save" @click="saveSkill" :loading="skillStore.loading" />
        </div>
      </div>

      <div v-if="skillStore.error" class="error-banner">
        {{ skillStore.error }}
      </div>

      <div v-if="isEditing && skillStore.loading" class="loading">Loading skill...</div>

      <div v-else class="edit-skill-form">
        <div class="form-column">
          <div class="form-section">
            <h2>Basic Info</h2>

            <div class="form-field">
              <label for="name">Name</label>
              <InputText
                id="name"
                v-model="skillForm.name"
                placeholder="skill-name"
                :disabled="isEditing"
                :class="{ 'field-error': errors.name }"
              />
              <span v-if="errors.name" class="error-text">{{ errors.name }}</span>
            </div>

            <div class="form-field">
              <label for="description">Description</label>
              <InputText
                id="description"
                v-model="skillForm.description"
                placeholder="Brief description of what this skill does"
                :class="{ 'field-error': errors.description }"
              />
              <span v-if="errors.description" class="error-text">{{ errors.description }}</span>
            </div>

            <div class="form-field">
              <label for="model">Model</label>
              <InputText
                id="model"
                v-model="skillForm.model"
                placeholder="sonnet"
              />
            </div>
          </div>

          <div class="form-section">
            <h2>Configuration</h2>

            <div class="form-field">
              <label>Roles</label>
              <div class="role-checkboxes">
                <label v-for="role in availableRoles" :key="role" class="role-checkbox">
                  <Checkbox v-model="selectedRoles" inputId="role-{{ role }}" :value="role" />
                  <span>{{ role }}</span>
                </label>
              </div>
              <span v-if="errors.roles" class="error-text">{{ errors.roles }}</span>
            </div>

            <div class="form-field">
              <label for="tools-select">Tools</label>
              <div class="tools-selection">
                <div v-if="selectedToolIds.length === 0" class="no-tools-hint">No tools selected</div>
                <Chip
                  v-for="toolId in selectedToolIds"
                  :key="toolId"
                  :label="getToolLabel(toolId)"
                  removable
                  @remove="removeTool(toolId)"
                  class="tool-chip"
                />
              </div>
              <div class="tools-add">
                <Dropdown
                  v-model="tempSelectedTool"
                  :options="availableToolsOptions.filter(t => !selectedToolIds.includes(t.value))"
                  optionLabel="label"
                  optionValue="value"
                  placeholder="Add tool..."
                  class="tools-dropdown"
                />
                <Button
                  icon="pi pi-plus"
                  @click="addTool"
                  :disabled="!tempSelectedTool"
                  severity="secondary"
                  size="small"
                />
              </div>
            </div>
          </div>
        </div>

        <div class="form-column">
          <div class="form-section form-section-content">
            <h2>Content</h2>

            <div class="form-field">
              <label for="content">Content (Markdown)</label>
              <Textarea
                id="content"
                v-model="skillForm.content"
                class="content-textarea content-textarea-expand"
                placeholder="# Skill instructions..."
                rows="15"
                :class="{ 'field-error': errors.content }"
              />
              <span v-if="errors.content" class="error-text">{{ errors.content }}</span>
            </div>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useSkillStore } from '@/stores/skill';
import { useToolStore } from '@/stores/tool';
import { useToast } from 'primevue/usetoast';
import Toast from 'primevue/toast';
import Button from 'primevue/button';
import InputText from 'primevue/inputtext';
import Textarea from 'primevue/textarea';
import Checkbox from 'primevue/checkbox';
import Chip from 'primevue/chip';
import Dropdown from 'primevue/dropdown';

const route = useRoute();
const router = useRouter();
const skillStore = useSkillStore();
const toolStore = useToolStore();
const toast = useToast();

const isEditing = computed(() => !!route.params.name);
const availableRoles = ['user', 'admin', 'system'];

const builtinToolNames = ['bash', 'read', 'write', 'glob', 'grep', 'question', 'todo', 'skill'];

const builtinToolsOptions = [
  { label: 'Bash', value: 'bash' },
  { label: 'Read', value: 'read' },
  { label: 'Write', value: 'write' },
  { label: 'Glob', value: 'glob' },
  { label: 'Grep', value: 'grep' },
  { label: 'Question', value: 'question' },
  { label: 'Todo', value: 'todo' },
  { label: 'Skill', value: 'skill' },
];

const customToolsOptions = computed(() =>
  toolStore.tools
    .filter((t) => t.is_active !== false)
    .map((t) => ({ label: t.name, value: t.name }))
);

const availableToolValues = computed(() => new Set([
  ...builtinToolNames,
  ...toolStore.tools.filter((t) => t.is_active !== false).map((t) => t.name),
]));

const availableToolsOptions = computed(() => {
  const seen = new Set();
  return [
    ...builtinToolsOptions,
    ...customToolsOptions.value.filter((t) => !seen.has(t.value) && (seen.add(t.value), true)),
  ];
});

function findMatchingToolValue(name) {
  if (!name) return null;
  const lower = name.toLowerCase();
  for (const value of availableToolValues.value) {
    if (value.toLowerCase() === lower) return value;
  }
  return null;
}

const selectedToolIds = ref([]);
const tempSelectedTool = ref(null);

function getToolLabel(value) {
  const found = availableToolsOptions.value.find((t) => t.value === value);
  return found ? found.label : value;
}

function addTool() {
  if (tempSelectedTool.value && !selectedToolIds.value.includes(tempSelectedTool.value)) {
    selectedToolIds.value.push(tempSelectedTool.value);
  }
  tempSelectedTool.value = null;
}

function removeTool(value) {
  selectedToolIds.value = selectedToolIds.value.filter((t) => t !== value);
}

const skillForm = reactive({
  name: '',
  description: '',
  content: '',
  roles: [],
  model: '',
});

const selectedRoles = ref([]);
const errors = ref({});

onMounted(async () => {
  await toolStore.listTools();

  if (isEditing.value) {
    try {
      const skill = await skillStore.getSkill(route.params.name);
      skillForm.name = skill.name;
      skillForm.description = skill.description;
      skillForm.content = skill.content;
      skillForm.model = skill.model || '';
      skillForm.roles = skill.roles || ['user'];
      selectedRoles.value = [...(skill.roles || ['user'])];
      if (skill.tools) {
        const toolNames = skill.tools
          .split(',')
          .map((t) => t.trim())
          .filter(Boolean);
        selectedToolIds.value = toolNames.map(findMatchingToolValue).filter(Boolean);
      } else {
        selectedToolIds.value = [];
      }
    } catch (error) {
      console.error('Failed to load skill:', error);
      toast.add({ severity: 'error', summary: 'Error', detail: error.response?.data?.error || 'Failed to load skill' });
      router.push('/skills');
    }
  } else {
    skillForm.name = '';
    skillForm.description = '';
    skillForm.content = '';
    skillForm.roles = ['user'];
    skillForm.model = '';
    selectedRoles.value = ['user'];
    selectedToolIds.value = [];
  }
});

const validate = () => {
  errors.value = {};

  if (!skillForm.name.trim()) {
    errors.value.name = 'Name is required';
  } else if (!/^[a-z][a-z0-9_-]*$/.test(skillForm.name)) {
    errors.value.name = 'Name must start with a letter and contain only lowercase letters, numbers, hyphens, and underscores';
  }

  if (!skillForm.description.trim()) {
    errors.value.description = 'Description is required';
  }

  if (selectedRoles.value.length === 0) {
    errors.value.roles = 'At least one role is required';
  }

  if (!skillForm.content.trim()) {
    errors.value.content = 'Content is required';
  }

  return Object.keys(errors.value).length === 0;
};

const saveSkill = async () => {
  if (!validate()) return;

  try {
    const data = {
      name: skillForm.name.trim(),
      description: skillForm.description.trim(),
      content: skillForm.content,
      roles: selectedRoles.value,
      tools: selectedToolIds.value.length > 0 ? selectedToolIds.value.join(', ') : null,
      model: skillForm.model ? skillForm.model.trim() : null,
    };

    if (isEditing.value) {
      await skillStore.updateSkill(route.params.name, data);
      toast.add({ severity: 'success', summary: 'Success', detail: 'Skill updated successfully' });
    } else {
      await skillStore.createSkill(data);
      toast.add({ severity: 'success', summary: 'Success', detail: 'Skill created successfully' });
    }

    setTimeout(() => router.push('/skills'), 1500);
  } catch (error) {
    const message = error.response?.data?.error || error.message || 'Failed to save skill';
    toast.add({ severity: 'error', summary: 'Error', detail: message });
  }
};
</script>

<style scoped>
.edit-skill-container {
  display: flex;
  flex-direction: column;
  height: 100vh;
}

.edit-skill-main {
  flex: 1;
  display: flex;
  flex-direction: column;
  padding: 2rem;
  background: #f9fafb;
  overflow-y: auto;
  min-height: 0;
}

.edit-skill-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.back-btn {
  padding: 0.5rem;
}

.edit-skill-header h1 {
  font-size: 1.875rem;
  color: #111827;
  margin: 0;
}

.header-actions {
  display: flex;
  gap: 0.75rem;
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

.edit-skill-form {
  width: 100%;
  flex: 1;
  display: flex;
  gap: 2rem;
  min-height: 0;
}

.form-column {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

@media (min-width: 1024px) {
  .form-column:nth-child(1) {
    flex: 0 0 380px;
  }
  .form-column:nth-child(2) {
    flex: 1 1 auto;
    min-height: 0;
  }
}

@media (max-width: 1023px) {
  .edit-skill-form {
    flex-direction: column;
  }
}

.form-section {
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.form-section-content {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.form-section-content .form-field {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.form-section-content .form-field textarea {
  flex: 1;
}

.form-section h2 {
  font-size: 1.125rem;
  color: #374151;
  margin: 0 0 1.25rem 0;
  padding-bottom: 0.75rem;
  border-bottom: 1px solid #e5e7eb;
}

.form-field {
  margin-bottom: 1.25rem;
}

.form-field:last-child {
  margin-bottom: 0;
}

.form-field label {
  display: block;
  margin-bottom: 0.375rem;
  font-weight: 500;
  color: #374151;
  font-size: 0.875rem;
}

.field-error {
  border-color: #ef4444 !important;
}

.error-text {
  display: block;
  color: #ef4444;
  font-size: 0.75rem;
  margin-top: 0.25rem;
}

.content-textarea {
  font-family: monospace;
  width: 100%;
  min-height: 200px;
  resize: vertical;
}

.content-textarea-expand {
  flex: 1;
  min-height: 300px;
}

.tools-selection {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-bottom: 0.75rem;
  min-height: 36px;
}

.no-tools-hint {
  color: #9ca3af;
  font-size: 0.875rem;
  padding: 0.25rem 0;
}

.tool-chip {
  max-width: 180px;
}

.tools-add {
  display: flex;
  gap: 0.5rem;
  align-items: center;
}

.tools-dropdown {
  width: 200px;
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
