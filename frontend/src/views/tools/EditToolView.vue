<template>
  <div class="edit-tool-container">
    <main class="edit-tool-main">
      <Toast :life="4000" />
      <div class="edit-tool-header">
        <div class="header-left">
          <Button icon="pi pi-arrow-left" outlined severity="secondary" @click="$router.push('/tools')" class="back-btn" />
          <h1>{{ isNew ? 'Create Tool' : 'Edit Tool' }}</h1>
        </div>
        <div class="header-actions">
          <Button label="Cancel" outlined @click="$router.push('/tools')" />
          <Button label="Save" @click="saveTool" :loading="toolStore.loading" />
        </div>
      </div>

      <div v-if="toolStore.error" class="error-banner">
        {{ toolStore.error }}
      </div>

      <div v-if="!isNew && toolStore.loading" class="loading">Loading tool...</div>

      <div v-else class="edit-tool-form">
        <div class="form-column">
          <div class="form-section">
            <h2>Basic Info</h2>

            <div class="form-field">
              <label for="name">Name</label>
              <InputText
                id="name"
                v-model="toolForm.name"
                placeholder="tool-name"
                :class="{ 'field-error': errors.name }"
              />
              <span v-if="errors.name" class="error-text">{{ errors.name }}</span>
            </div>

            <div class="form-field">
              <label for="description">Description</label>
              <InputText
                id="description"
                v-model="toolForm.description"
                placeholder="Brief description of what this tool does"
                :class="{ 'field-error': errors.description }"
              />
              <span v-if="errors.description" class="error-text">{{ errors.description }}</span>
            </div>

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
              <label>
                <Checkbox v-model="toolForm.is_active" inputId="is_active" />
                Active
              </label>
            </div>
          </div>
        </div>

        <div class="form-column">
          <div class="form-section form-section-content">
            <h2>Code</h2>

            <div class="form-field">
              <label for="code">Function Code (JavaScript)</label>
              <Textarea
                id="code"
                v-model="toolForm.code"
                class="content-textarea content-textarea-expand"
                placeholder="async function(params) {&#10;  // your tool logic here&#10;  return result;&#10; }"
                rows="20"
                :class="{ 'field-error': errors.code }"
              />
              <span v-if="errors.code" class="error-text">{{ errors.code }}</span>
            </div>
          </div>

          <div class="form-section form-section-content">
            <h2>Parameters</h2>

            <div class="form-field">
              <label for="parameters">Parameters (JSON)</label>
              <Textarea
                id="parameters"
                v-model="toolForm.parametersText"
                class="content-textarea content-textarea-expand"
                placeholder='[{"name": "input", "type": "string", "required": true, "description": "Input value"}]'
                rows="10"
                :class="{ 'field-error': errors.parameters }"
              />
              <span v-if="errors.parameters" class="error-text">{{ errors.parameters }}</span>
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
import { useToolStore } from '@/stores/tool';
import { useToast } from 'primevue/usetoast';
import Toast from 'primevue/toast';
import Button from 'primevue/button';
import InputText from 'primevue/inputtext';
import Textarea from 'primevue/textarea';
import Checkbox from 'primevue/checkbox';

const route = useRoute();
const router = useRouter();
const toolStore = useToolStore();
const toast = useToast();

const isNew = computed(() => !route.params.id);
const availableRoles = ['user', 'admin', 'system'];

const toolForm = reactive({
  name: '',
  description: '',
  code: '',
  parametersText: '[]',
  is_active: true,
});

const selectedRoles = ref([]);
const errors = ref({});

onMounted(async () => {
  await toolStore.listTools();

  if (!isNew.value) {
    try {
      const tool = await toolStore.getToolById(route.params.id);
      toolForm.name = tool.name;
      toolForm.description = tool.description;
      toolForm.code = tool.function_code || '';
      toolForm.parametersText = JSON.stringify(tool.parameters, null, 2);
      toolForm.is_active = tool.is_active;
      selectedRoles.value = [...(tool.roles || ['user'])];
    } catch (error) {
      console.error('Failed to load tool:', error);
      toast.add({ severity: 'error', summary: 'Error', detail: error.response?.data?.error || 'Failed to load tool' });
      router.push('/tools');
    }
  } else {
    toolForm.name = '';
    toolForm.description = '';
    toolForm.code = '';
    toolForm.parametersText = '[]';
    toolForm.is_active = true;
    selectedRoles.value = ['user'];
  }
});

const validate = () => {
  errors.value = {};

  if (!toolForm.name.trim()) {
    errors.value.name = 'Name is required';
  } else if (!/^[a-z][a-z0-9_-]*$/.test(toolForm.name)) {
    errors.value.name = 'Name must start with a letter and contain only lowercase letters, numbers, hyphens, and underscores';
  }

  if (!toolForm.description.trim()) {
    errors.value.description = 'Description is required';
  }

  if (selectedRoles.value.length === 0) {
    errors.value.roles = 'At least one role is required';
  }

  if (!toolForm.code.trim()) {
    errors.value.code = 'Code is required';
  } else {
    try {
      new Function('params', toolForm.code);
    } catch (e) {
      errors.value.code = 'Invalid JavaScript function code: ' + e.message;
    }
  }

  if (toolForm.parametersText.trim()) {
    try {
      JSON.parse(toolForm.parametersText);
    } catch (e) {
      errors.value.parameters = 'Invalid JSON: ' + e.message;
    }
  }

  return Object.keys(errors.value).length === 0;
};

const saveTool = async () => {
  if (!validate()) return;

  try {
    const params = JSON.parse(toolForm.parametersText);
    const data = {
      name: toolForm.name.trim(),
      description: toolForm.description.trim(),
      function_code: toolForm.code,
      parameters: params,
      is_active: toolForm.is_active,
      roles: selectedRoles.value,
    };

    if (!isNew.value) {
      await toolStore.updateTool(route.params.id, data);
      toast.add({ severity: 'success', summary: 'Success', detail: 'Tool updated successfully' });
    } else {
      await toolStore.createTool(data);
      toast.add({ severity: 'success', summary: 'Success', detail: 'Tool created successfully' });
    }

    setTimeout(() => router.push('/tools'), 1500);
  } catch (error) {
    const message = error.response?.data?.error || error.message || 'Failed to save tool';
    toast.add({ severity: 'error', summary: 'Error', detail: message });
  }
};
</script>

<style scoped>
.edit-tool-container {
  display: flex;
  flex-direction: column;
  height: 100vh;
}

.edit-tool-main {
  flex: 1;
  display: flex;
  flex-direction: column;
  padding: 2rem;
  background: #f9fafb;
  overflow-y: auto;
  min-height: 0;
}

.edit-tool-header {
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

.edit-tool-header h1 {
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

.edit-tool-form {
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
  .edit-tool-form {
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
