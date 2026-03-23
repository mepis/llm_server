<template>
  <div class="modal">
    <div class="modal-content">
      <h3>{{ editing ? 'Edit Script' : 'Create New Script' }}</h3>
      <div class="form-group">
        <label for="scriptName">Script Name</label>
        <input
          v-model="scriptName"
          type="text"
          id="scriptName"
          placeholder="e.g., run_qwen3.5-35-q8.sh"
          :disabled="editing"
        />
      </div>
      <div class="form-group">
        <label for="content">Content</label>
        <textarea
          v-model="content"
          id="content"
          placeholder="#!/bin/bash\n\necho 'Hello World'"
        ></textarea>
      </div>
      <div class="modal-actions">
        <button @click="handleSave" class="btn btn-primary" :disabled="loading">
          {{ loading ? 'Saving...' : 'Save' }}
        </button>
        <button @click="handleCancel" class="btn btn-secondary">Cancel</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue';

const props = defineProps({
  script: {
    type: Object,
    default: null
  },
  editing: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits(['save', 'cancel']);

const scriptName = ref('');
const content = ref('');
const loading = ref(false);

watch(() => props.script, (newScript) => {
  if (newScript) {
    scriptName.value = newScript.name;
    content.value = newScript.content;
  }
}, { immediate: true });

const handleSave = () => {
  if (!scriptName.value.trim() || !content.value.trim()) {
    alert('Please provide both script name and content');
    return;
  }
  emit('save', {
    name: scriptName.value,
    content: content.value
  });
};

const handleCancel = () => {
  emit('cancel');
};
</script>

<style scoped>
.modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  background: white;
  padding: 2rem;
  border-radius: 8px;
  max-width: 800px;
  width: 90%;
  max-height: 90vh;
  overflow-y: auto;
}

.modal-content h3 {
  margin-bottom: 1.5rem;
}

.form-group {
  margin-bottom: 1rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 500;
}

.form-group input,
.form-group textarea {
  width: 100%;
  padding: 0.5rem;
  border: 1px solid #d1d5db;
  border-radius: 4px;
  font-size: 1rem;
}

textarea {
  min-height: 300px;
  font-family: 'Courier New', Courier, monospace;
}

.modal-actions {
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
  margin-top: 1.5rem;
}
</style>
