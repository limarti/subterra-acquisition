<template>
  <div class="relative rounded-full transition-colors border-1 cursor-pointer"
       :class="[
         containerClasses,
         disabled ? 'bg-gray-700' : 'bg-gray-800'
       ]"
       @click="handleClick">
    <div class="absolute top-[-1px] left-[-1px] rounded-full transition-transform"
         :class="[
           knobClasses,
           knobColorClasses,
           { [translateClass]: modelValue && !disabled }
         ]" />
  </div>
</template>

<script setup lang="ts">
  import { computed } from 'vue';

  interface Props
  {
    modelValue: boolean
    size?: 'small' | 'medium' | 'large'
    disabled?: boolean
  }

  interface Emits
  {
    (event: 'update:modelValue', value: boolean): void
  }

  const props = withDefaults(defineProps<Props>(), {
    size: 'small',
    disabled: false
  });

  const emit = defineEmits<Emits>();

  const containerClasses = computed(() =>
  {
    switch (props.size)
    {
    case 'large':
      return 'w-10 h-5';
    case 'medium':
      return 'w-7 h-4';
    case 'small':
    default:
      return 'w-7 h-4';
    }
  });

  const knobClasses = computed(() =>
  {
    switch (props.size)
    {
    case 'large':
      return 'w-5 h-5';
    case 'medium':
      return 'w-4 h-4';
    case 'small':
    default:
      return 'w-4 h-4';
    }
  });

  const knobColorClasses = computed(() =>
  {
    if (props.disabled)
    {
      return 'bg-gray-500';
    }
    return props.modelValue ? 'bg-green-500' : 'bg-gray-400';
  });

  const translateClass = computed(() =>
  {
    switch (props.size)
    {
    case 'large':
      return 'translate-x-5';
    case 'medium':
      return 'translate-x-3';
    case 'small':
    default:
      return 'translate-x-3';
    }
  });

  function handleClick()
  {
    if (!props.disabled)
    {
      emit('update:modelValue', !props.modelValue);
    }
  }
</script>
