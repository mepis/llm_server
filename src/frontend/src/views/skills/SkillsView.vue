<template>
  <div class="skills-container">
    <main class="skills-main">
      <Toast />
      <div class="skills-header">
        <h1>Skills</h1>
         <RouterLink to="/skills/new">
            <Button
              v-if="skillStore.hasAdminRole"
              label="New Skill"
              icon="pi pi-plus"
            />
          </RouterLink>
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
          <RouterLink :to="`/skills/${skill.name}/edit`">
            <Button
              v-if="skillStore.hasAdminRole"
              label="Edit"
              icon="pi pi-pencil"
              outlined
            />
          </RouterLink>
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
    </main>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue';
import { RouterLink } from 'vue-router';
import { useSkillStore } from '@/stores/skill';
import { useToast } from 'primevue/usetoast';
import Toast from 'primevue/toast';
import Button from 'primevue/button';
import Dialog from 'primevue/dialog';


const skillStore = useSkillStore();
const toast = useToast();

const viewDialogVisible = ref(false);
const selectedSkill = ref(null);

const openViewDialog = (skill) => {
  selectedSkill.value = skill;
  viewDialogVisible.value = true;
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
.skills-container {
  display: flex;
  flex-direction: column;
  height: 100vh;
}

.skills-main {
  flex: 1;
  padding: 2rem;
  background: #f9fafb;
  overflow-y: auto;
}

.skills-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
}

.skills-header h1 {
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

.view-content {
  display: flex;
  flex-direction: column;
  gap: 1rem;
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
