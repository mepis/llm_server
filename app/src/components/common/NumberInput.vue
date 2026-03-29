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
    <input
      type="number"
      :value="modelValue"
      @input="$emit('update:modelValue', $event.target.value)"
      :min="min"
      :max="max"
      :step="step"
      :placeholder="placeholder"
      class="form-input"
    />
    <span v-if="hint" class="hint">{{ hint }}</span>
  </div>
</template>

<script setup>
import Tooltip from '../Tooltip.vue'

defineProps({
  modelValue: [Number, String],
  label: String,
  tooltipTitle: String,
  tooltipDescription: String,
  tooltipRecommended: String,
  tooltipExample: String,
  min: [Number, String],
  max: [Number, String],
  step: [Number, String],
  placeholder: String,
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
