<template>
  <div class="container">
    <div class="header">
      <h1>Scripts</h1>
      <button @click="handleCreate" class="btn btn-primary">+ New Script</button>
    </div>

    <div v-if="loading" class="loading">Loading scripts...</div>

    <div v-else-if="error" class="error">
      {{ error }}
    </div>

    <div v-else-if="scripts.length === 0" class="card">
      <p>No scripts found. Create your first script to get started.</p>
    </div>

    <div v-else class="grid">
      <div v-for="script in scripts" :key="script.name" class="card">
        <h3>{{ script.name }}</h3>
        <p class="meta">Modified: {{ new Date(script.modified).toLocaleString() }}</p>
        <div class="actions">
          <button @click="handleEdit(script)" class="btn btn-secondary">Edit</button>
          <button @click="handleRun(script.name)" class="btn btn-success">Run</button>
          <button @click="handleDelete(script.name)" class="btn btn-danger">Delete</button>
        </div>
      </div>
    </div>

    <ScriptEditor
      v-if="showEditor"
      :script="currentScript"
      :editing="!!editingScript"
      @save="handleSave"
      @cancel="showEditor = false"
    />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useScripts } from '../composables/useScripts';
import ScriptEditor from '../components/ScriptEditor.vue';

const {
  scripts,
  currentScript,
  loading,
  error,
  listScripts,
  getScript,
  createScript,
  updateScript,
  deleteScript,
  runScript
} = useScripts();

const showEditor = ref(false);
const editingScript = ref(null);

onMounted(() => {
  listScripts();
});

const handleEdit = async (script) => {
  editingScript.value = script;
  await getScript(script.name);
  showEditor.value = true;
};

const handleCreate = () => {
  editingScript.value = null;
  currentScript.value = { content: '#!/bin/bash\n\n' };
  showEditor.value = true;
};

const handleSave = async (data) => {
  try {
    if (editingScript.value) {
      await updateScript(editingScript.value.name, data);
    } else {
      await createScript(data);
    }
    showEditor.value = false;
    listScripts();
  } catch (err) {
    console.error('Failed to save script:', err);
  }
};

const handleDelete = async (name) => {
  if (confirm(`Are you sure you want to delete ${name}?`)) {
    try {
      await deleteScript(name);
    } catch (err) {
      console.error('Failed to delete script:', err);
    }
  }
};

const handleRun = async (name) => {
  try {
    const result = await runScript(name);
    console.log('Script output:', result.output);
  } catch (err) {
    console.error('Failed to run script:', err);
  }
};
</script>

<style scoped>
.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid #e0e0e0;
}

.card {
  background: white;
  border-radius: 8px;
  padding: 1.5rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  margin-bottom: 1rem;
}

.card h3 {
  margin-bottom: 0.5rem;
  color: #1a1a1a;
}

.card .meta {
  color: #666;
  font-size: 0.85rem;
  margin-bottom: 1rem;
}

.actions {
  display: flex;
  gap: 0.5rem;
}

.grid {
  display: grid;
  gap: 1rem;
}
</style>
