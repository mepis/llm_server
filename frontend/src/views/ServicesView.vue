<template>
  <div class="container">
    <div class="header">
      <h1>Services</h1>
      <button @click="showCreateService" class="btn btn-primary">+ New Service</button>
    </div>

    <div v-if="loading" class="loading">Loading services...</div>

    <div v-else-if="error" class="error">
      {{ error }}
    </div>

    <div v-else-if="services.length === 0" class="card">
      <p>No services found. Create a systemd service from a script to get started.</p>
    </div>

    <div v-else class="grid">
      <div v-for="service in services" :key="service.name" class="card">
        <h3>{{ service.name }}</h3>
        <p class="meta">Status: {{ service.status }}</p>
        <div class="actions">
          <button @click="handleStart(service.name)" class="btn btn-success">Start</button>
          <button @click="handleStop(service.name)" class="btn btn-danger">Stop</button>
          <button @click="handleRestart(service.name)" class="btn btn-secondary">Restart</button>
          <button @click="handleLogs(service.name)" class="btn btn-secondary">Logs</button>
          <button @click="handleDelete(service.name)" class="btn btn-danger">Remove</button>
        </div>
      </div>
    </div>

    <div v-if="showLogsModal" class="modal">
      <div class="modal-content">
        <h3>Logs for {{ currentService }}</h3>
        <div class="logs">
          <div v-for="(log, index) in logs" :key="index" class="log-entry">
            {{ log }}
          </div>
        </div>
        <div class="modal-actions">
          <button @click="showLogsModal = false" class="btn btn-secondary">Close</button>
        </div>
      </div>
    </div>

    <div v-if="showCreateServiceModal" class="modal">
      <div class="modal-content">
        <h3>Create New Service</h3>
        <div class="form-group">
          <label for="scriptName">Script Name</label>
          <select v-model="newService.scriptName" id="scriptName">
            <option v-for="script in scripts" :key="script.name" :value="script.name">
              {{ script.name }}
            </option>
          </select>
        </div>
        <div class="form-group">
          <label for="serviceName">Service Name</label>
          <input v-model="newService.serviceName" type="text" id="serviceName" placeholder="e.g., llama.service" />
        </div>
        <div class="form-group">
          <label for="description">Description</label>
          <input v-model="newService.description" type="text" id="description" />
        </div>
        <div class="form-group">
          <label for="user">User</label>
          <input v-model="newService.user" type="text" id="user" value="root" />
        </div>
        <div class="modal-actions">
          <button @click="handleCreateService" class="btn btn-primary">Create</button>
          <button @click="showCreateServiceModal = false" class="btn btn-secondary">Cancel</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useServices } from '../composables/useServices';
import { useScripts } from '../composables/useScripts';

const {
  services,
  logs,
  loading,
  error,
  listServices,
  createService,
  removeService,
  startService,
  stopService,
  restartService,
  getLogs
} = useServices();

const { scripts, listScripts } = useScripts();

const showLogsModal = ref(false);
const showCreateServiceModal = ref(false);
const currentService = ref('');
const newService = ref({
  scriptName: '',
  serviceName: '',
  description: '',
  user: 'root'
});

onMounted(() => {
  listServices();
  listScripts();
});

const showCreateService = () => {
  newService.value = {
    scriptName: '',
    serviceName: '',
    description: '',
    user: 'root'
  };
  showCreateServiceModal.value = true;
};

const handleCreateService = async () => {
  try {
    await createService(newService.value);
    showCreateServiceModal.value = false;
  } catch (err) {
    console.error('Failed to create service:', err);
  }
};

const handleDelete = async (name) => {
  if (confirm(`Are you sure you want to remove ${name}?`)) {
    try {
      await removeService(name);
    } catch (err) {
      console.error('Failed to remove service:', err);
    }
  }
};

const handleStart = async (name) => {
  try {
    await startService(name);
  } catch (err) {
    console.error('Failed to start service:', err);
  }
};

const handleStop = async (name) => {
  try {
    await stopService(name);
  } catch (err) {
    console.error('Failed to stop service:', err);
  }
};

const handleRestart = async (name) => {
  try {
    await restartService(name);
  } catch (err) {
    console.error('Failed to restart service:', err);
  }
};

const handleLogs = async (name) => {
  currentService.value = name;
  try {
    await getLogs(name);
    showLogsModal.value = true;
  } catch (err) {
    console.error('Failed to load logs:', err);
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
  flex-wrap: wrap;
}

.grid {
  display: grid;
  gap: 1rem;
}

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
  max-width: 500px;
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
.form-group select {
  width: 100%;
  padding: 0.5rem;
  border: 1px solid #d1d5db;
  border-radius: 4px;
}

.modal-actions {
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
  margin-top: 1.5rem;
}

.logs {
  background: #1f2937;
  color: #10b981;
  padding: 1rem;
  border-radius: 4px;
  font-family: monospace;
  max-height: 400px;
  overflow-y: auto;
  margin-bottom: 1rem;
}

.logs .log-entry {
  margin-bottom: 0.25rem;
  white-space: pre-wrap;
}
</style>
