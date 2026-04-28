<template>
  <div class="tools-container">
    <main class="tools-main">
      <Toast />
      <div class="tools-header">
        <h1>Tool Builder</h1>
        <RouterLink to="/tools/new">
          <Button
            v-if="toolStore.hasAdminRole"
            label="New Tool"
            icon="pi pi-plus"
          />
        </RouterLink>
      </div>

      <div v-if="toolStore.error" class="error-banner">
      {{ toolStore.error }}
    </div>

    <div v-if="toolStore.loading" class="loading">Loading tools...</div>

    <div v-else class="tools-grid">
      <div v-for="tool in toolStore.tools" :key="tool._id" class="tool-card">
        <div class="tool-card-header">
          <h3>{{ tool.name }}</h3>
          <div class="tool-status">
            <Badge :value="tool.is_active ? 'Active' : 'Disabled'" :severity="tool.is_active ? 'success' : 'danger'" />
          </div>
        </div>

        <p class="tool-description">{{ tool.description }}</p>

        <div class="tool-roles">
          <span v-for="role in (tool.roles || ['user'])" :key="role" class="role-badge">{{ role }}</span>
        </div>

        <div v-if="tool.parameters && tool.parameters.length" class="tool-parameters">
          <h4>Parameters</h4>
          <ul>
            <li v-for="param in tool.parameters" :key="param.name">
              <strong>{{ param.name }}</strong> ({{ param.type }})
              <span v-if="param.required" class="required">*</span>
              <span v-if="param.description"> - {{ param.description }}</span>
            </li>
          </ul>
        </div>

        <div class="tool-actions">
          <Button
            v-if="toolStore.canExecuteTool(tool)"
            label="Execute"
            icon="pi pi-play"
            outlined
            @click="openExecuteDialog(tool)"
          />
          <RouterLink :to="`/tools/${tool._id}/edit`">
            <Button
              v-if="toolStore.hasAdminRole"
              label="Edit"
              icon="pi pi-pencil"
              outlined
            />
          </RouterLink>
          <Button
            v-if="toolStore.hasAdminRole"
            label="Delete"
            icon="pi pi-trash"
            severity="danger"
            outlined
            @click="confirmDelete(tool)"
          />
          <div v-if="!toolStore.canExecuteTool(tool)" class="access-denied">Access denied</div>
        </div>
      </div>

      <div v-if="toolStore.tools.length === 0" class="empty-state">
        <p>No tools found. Create your first tool to get started.</p>
      </div>
    </div>

    <!-- Execute Dialog -->
    <Dialog
      v-model:visible="executeDialogVisible"
      :header="'Execute: ' + (selectedTool?.name || '')"
      modal
      class="execute-dialog"
    >
      <div v-if="selectedTool" class="execute-form">
        <div v-for="param in (selectedTool.parameters || [])" :key="param.name" class="form-field">
          <label>
            {{ param.name }}
            <span v-if="param.required" class="required">*</span>
          </label>
          <InputText
            v-if="param.type === 'string'"
            v-model="executeParams[param.name]"
            :placeholder="param.description || param.name"
          />
          <InputText
            v-else-if="param.type === 'number'"
            v-model.number="executeParams[param.name]"
            type="number"
            :placeholder="param.description || param.name"
          />
          <InputText
            v-else
            v-model="executeParams[param.name]"
            :placeholder="param.description || param.name"
          />
        </div>
        <div v-if="executeResult" class="execute-result">
          <h4>Result</h4>
          <pre>{{ executeResult }}</pre>
        </div>
        <div v-if="executeError" class="execute-error">
          {{ executeError }}
        </div>
      </div>
      <template #footer>
        <Button label="Cancel" outlined @click="executeDialogVisible = false" />
        <Button label="Run" icon="pi pi-play" @click="runTool" :disabled="toolStore.loading" />
      </template>
    </Dialog>
    </main>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue';
import { RouterLink } from 'vue-router';
import { useToolStore } from '@/stores/tool';
import { useToast } from 'primevue/usetoast';
import Toast from 'primevue/toast';
import Button from 'primevue/button';
import Dialog from 'primevue/dialog';
import Badge from 'primevue/badge';
import InputText from 'primevue/inputtext';

const toolStore = useToolStore();
const toast = useToast();

const executeDialogVisible = ref(false);
const selectedTool = ref(null);

const executeParams = reactive({});
const executeResult = ref(null);
const executeError = ref(null);

const openExecuteDialog = (tool) => {
  selectedTool.value = tool;
  Object.keys(executeParams).forEach((key) => delete executeParams[key]);
  executeResult.value = null;
  executeError.value = null;
  executeDialogVisible.value = true;
};

const runTool = async () => {
  try {
    executeResult.value = null;
    executeError.value = null;
    const result = await toolStore.executeTool(selectedTool.value._id, executeParams);
    executeResult.value = result.output;
  } catch (error) {
    executeError.value = error.response?.data?.error || 'Failed to execute tool';
  }
};

const confirmDelete = async (tool) => {
  if (!confirm(`Delete "${tool.name}"?`)) return;
  try {
    await toolStore.deleteTool(tool._id);
    toast.add({ severity: 'success', summary: 'Success', detail: 'Tool deleted' });
    await toolStore.listTools();
  } catch (error) {
    toast.add({ severity: 'error', summary: 'Error', detail: error.response?.data?.error || 'Failed to delete tool' });
  }
};

toolStore.listTools();
</script>

<style scoped>
.tools-container {
  display: flex;
  flex-direction: column;
  height: 100vh;
}

.tools-main {
  flex: 1;
  padding: 2rem;
  background: #f9fafb;
  overflow-y: auto;
}

.tools-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
}

.tools-header h1 {
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

.loading {
  text-align: center;
  padding: 2rem;
}

.tools-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 1.5rem;
}

.tool-card {
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.tool-card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
}

.tool-card-header h3 {
  margin: 0;
}

.tool-description {
  color: #666;
  margin: 0.5rem 0;
}

.tool-roles {
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

.tool-parameters h4 {
  margin: 0 0 0.5rem 0;
  font-size: 0.875rem;
}

.tool-parameters ul {
  margin: 0;
  padding-left: 1.25rem;
  font-size: 0.875rem;
}

.required {
  color: #ef4444;
}

.tool-actions {
  display: flex;
  gap: 0.5rem;
  margin-top: 1rem;
  flex-wrap: wrap;
}

.access-denied {
  color: #ef4444;
  font-size: 0.875rem;
  margin-top: 0.5rem;
}

.empty-state {
  grid-column: 1 / -1;
  text-align: center;
  padding: 3rem;
  color: #666;
}

.execute-form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.form-field label {
  display: block;
  margin-bottom: 0.25rem;
  font-weight: 500;
}

.execute-result {
  background: #f0fdf4;
  padding: 1rem;
  border-radius: 8px;
}

.execute-result pre {
  margin: 0.5rem 0 0 0;
  white-space: pre-wrap;
  word-break: break-word;
}

.execute-error {
  background: #fee2e2;
  color: #991b1b;
  padding: 1rem;
  border-radius: 8px;
}
</style>
