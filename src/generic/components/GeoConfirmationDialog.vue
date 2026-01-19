<template>
  <GeoGenericDialog :showCloseButton="false">
    <template #icon>
      <svg class="w-6 h-6" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="12" cy="12" r="10" stroke="white" stroke-opacity="0.5" stroke-width="2" />
        <path d="M12 8V12" stroke="white" stroke-opacity="0.5" stroke-width="2" stroke-linecap="round" />
        <circle cx="12" cy="16" r="1" fill="white" fill-opacity="0.5" />
      </svg>
    </template>

    <template #title>
      {{ title }}
    </template>

    <template #content>
      <div class="p-6">
        <p class="text-white/80 text-sm leading-relaxed mb-6">
          {{ message }}
        </p>

        <div class="flex gap-3 w-full">
          <button class="flex-1 px-4 py-2 text-sm text-white/80 bg-background-lighter-lighter rounded hover:bg-background-lighter-lighter-lighter transition-colors cursor-pointer"
                  @click="handleCancel">
            {{ cancelText }}
          </button>
          <button class="flex-1 px-4 py-2 text-sm text-background bg-accent-primary rounded hover:opacity-90 transition-colors cursor-pointer"
                  @click="handleConfirm">
            {{ confirmText }}
          </button>
        </div>
      </div>
    </template>
  </GeoGenericDialog>
</template>

<script setup lang="ts">
  import { ref } from 'vue';
  import GeoGenericDialog from '@/generic/components/GeoGenericDialog.vue';
  import { closeDialog } from 'vue3-promise-dialog';

  interface Props
  {
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
  }

  const props = withDefaults(defineProps<Props>(), {
    confirmText: 'Confirm',
    cancelText: 'Cancel'
  });

  const confirmed = ref(false);

  const handleConfirm = () =>
  {
    confirmed.value = true;
    closeDialog();
  };

  const handleCancel = () =>
  {
    confirmed.value = false;
    closeDialog();
  };

  defineExpose({ returnValue: () => confirmed.value });
</script>
