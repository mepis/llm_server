<template>
  <div class="form-group">
    <label class="form-label">
      {{ label }}
      <Tooltip
        v-if="tooltipTitle"
        :title="tooltipTitle"
        :description="tooltipDescription"
        :recommended="tooltipRecommended"
        :example="tooltipExample"
      />
    </label>
    <select
      :value="modelValue"
      @change="$emit('update:modelValue', $event.target.value)"
      class="form-select"
    >
      <option v-for="option in options" :key="option.value" :value="option.value">
        {{ option.label }}
      </option>
    </select>
    <span v-if="hint" class="hint">{{ hint }}</span>
  </div>
</template>

<script setup>
import Tooltip from '../Tooltip.vue'

defineProps({
  modelValue: [String, Number],
  label: String,
  options: Array,
  tooltipTitle: String,
  tooltipDescription: String,
  tooltipRecommended: String,
  tooltipExample: String,
  hint: String
})

defineEmits(['update:modelValue'])
</script>

<style scoped>
.hint {
  display: block;
  font-size: 0.875rem;
  color: var(--text-muted);
  margin-top: 4px;
}
</style>
