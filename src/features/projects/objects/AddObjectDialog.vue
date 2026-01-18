<template>
  <GeoGenericDialog>
    <template #icon>
      <svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 5V19M5 12H19" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-white/50"/>
      </svg>
    </template>

    <template #title>
      Add Object
    </template>

    <template #content>
      <button
        type="button"
        class="w-full flex items-center gap-3 py-4 px-3 border-b border-border-gray hover:bg-background-darker-darker cursor-pointer transition"
        @click="handleAddEmlTrace"
      >
        <svg class="w-5 h-5 text-accent-primary" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M21 10C21 17 12 23 12 23C12 23 3 17 3 10C3 7.61305 3.94821 5.32387 5.63604 3.63604C7.32387 1.94821 9.61305 1 12 1C14.3869 1 16.6761 1.94821 18.364 3.63604C20.0518 5.32387 21 7.61305 21 10Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          <circle cx="12" cy="10" r="3" stroke="currentColor" stroke-width="2"/>
        </svg>
        <span class="text-white/80 text-sm">EML Trace</span>
      </button>
    </template>
  </GeoGenericDialog>
</template>

<script setup lang="ts">
  import { closeDialog } from 'vue3-promise-dialog';
  import GeoGenericDialog from '@/generic/components/GeoGenericDialog.vue';
  import type { ProjectObject } from './ProjectObject.type';
  import { createEmlTrace, getNextObjectName } from './objectUtils';

  interface Props
  {
    existingObjects: ProjectObject[];
  }

  const props = defineProps<Props>();

  const handleAddEmlTrace = (): void =>
  {
    const name = getNextObjectName(props.existingObjects, 'emlTrace');
    const newObject = createEmlTrace(name);
    closeDialog(newObject);
  };

  defineExpose({ returnValue: () => null });
</script>

<style scoped>
  @reference "tailwindcss";
</style>
