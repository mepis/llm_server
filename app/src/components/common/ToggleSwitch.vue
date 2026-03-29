<template>
  <div class="toggle-container">
    <div class="toggle-label">
      <span class="toggle-name">{{ name }}</span>
      <span v-if="description" class="toggle-description">{{ description }}</span>
    </div>
    <label class="toggle-switch-wrapper">
      <input
        type="checkbox"
        :checked="modelValue"
        @change="$emit('update:modelValue', $event.target.checked)"
        class="toggle-switch"
      />
    </label>
  </div>
</template>

<script setup>
defineProps({
  modelValue: Boolean,
  name: String,
  description: String
})

defineEmits(['update:modelValue'])
</script>
