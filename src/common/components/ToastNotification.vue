<template>
  <div :class="toastClasses"
       class="toast backdrop-blur-sm border rounded-lg shadow-lg px-4 py-3 pointer-events-auto max-w-md"
       role="alert"
       aria-live="assertive"
       @click="$emit('close')">
    <div class="flex items-start gap-3">
      <svg class="w-5 h-5 text-white shrink-0 mt-0.5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 8V12M12 16H12.01M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
      </svg>
      <div class="flex-1">
        <p class="text-sm font-medium text-white">
          {{ message }}
        </p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { computed } from 'vue';
  import { ToastType } from '@/common/types/ToastType';

  const props = defineProps<{
    message: string;
    type: ToastType;
  }>();

  defineEmits<{ close: [] }>();

  const toastClasses = computed(() =>
  {
    switch (props.type)
    {
    case ToastType.SUCCESS:
      return 'bg-green-500';
    case ToastType.ERROR:
      return 'bg-red-500';
    default:
      return 'bg-gray-500';
    }
  });
</script>
