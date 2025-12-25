<template>
  <div class="relative">
    <input :value="modelValue"
           :min="min"
           :max="max"
           :step="step"
           type="range"
           class="w-full h-1.5 bg-blue-500 rounded-lg appearance-none cursor-pointer geo-slider"
           @input="handleInput">
  </div>
</template>

<script setup lang="ts">
  interface Props
  {
    modelValue: number;
    min?: number;
    max?: number;
    step?: number;
  }

  interface Emits
  {
    (e: 'update:modelValue', value: number): void;
  }

  const props = withDefaults(defineProps<Props>(), {
    min: 0,
    max: 1,
    step: 0.01
  });

  const emit = defineEmits<Emits>();

  const handleInput = (event: Event): void =>
  {
    const target = event.target as HTMLInputElement;
    emit('update:modelValue', parseFloat(target.value));
  };
</script>

<style scoped>
.geo-slider::-webkit-slider-thumb {
  appearance: none;
  width: 0.4375rem;
  height: 1.5rem;
  border-radius: 0.25rem;
  background: var(--color-accent-attention);
  cursor: pointer;
  border: none;
}

.geo-slider::-moz-range-thumb {
  width: 0.4375rem;
  height: 1.5rem;
  border-radius: 0.25rem;
  background: var(--color-accent-attention);
  cursor: pointer;
  border: none;
}
</style>
