<template>
  <GeoGenericDialog>
    <template #icon>
      <svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M9 5H7C5.89543 5 5 5.89543 5 7V19C5 20.1046 5.89543 21 7 21H17C18.1046 21 19 20.1046 19 19V7C19 5.89543 18.1046 5 17 5H15" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-white/50"/>
        <path d="M9 5C9 3.89543 9.89543 3 11 3H13C14.1046 3 15 3.89543 15 5V7H9V5Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-white/50"/>
      </svg>
    </template>

    <template #title>
      {{ layer.name }}
    </template>

    <template #content>
      <div v-if="elements.length === 0" class="py-8 text-center text-text-secondary text-sm">
        No elements
      </div>

      <div v-for="(element, index) in elements" :key="element.id"
           class="flex items-center justify-between py-3 px-3 border-b border-border-gray hover:bg-background-darker-darker transition">
        <div class="flex items-center gap-3">
          <svg class="w-4 h-4 text-accent-primary" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="12" cy="12" r="3" stroke="currentColor" stroke-width="2"/>
          </svg>
          <div class="flex flex-col">
            <span class="text-white/80 text-sm">Reading {{ index + 1 }}</span>
            <span class="text-text-secondary text-xs">{{ formatTimestamp(element.epoch) }}</span>
          </div>
        </div>

        <button
          type="button"
          class="p-1 text-text-secondary hover:text-red-400 transition cursor-pointer"
          title="Delete element"
          @click="handleDeleteElement(element.id)"
        >
          <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M3 6H5H21" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M8 6V4C8 3.46957 8.21071 2.96086 8.58579 2.58579C8.96086 2.21071 9.46957 2 10 2H14C14.5304 2 15.0391 2.21071 15.4142 2.58579C15.7893 2.96086 16 3.46957 16 4V6M19 6V20C19 20.5304 18.7893 21.0391 18.4142 21.4142C18.0391 21.7893 17.5304 22 17 22H7C6.46957 22 5.96086 21.7893 5.58579 21.4142C5.21071 21.0391 5 20.5304 5 20V6H19Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </button>
      </div>
    </template>
  </GeoGenericDialog>
</template>

<script setup lang="ts">
  import { computed } from 'vue';
  import { closeDialog } from 'vue3-promise-dialog';
  import GeoGenericDialog from '@/generic/components/GeoGenericDialog.vue';
  import type { Layer } from '../objects/ProjectObject.type';

  interface Props
  {
    layer: Layer;
  }

  interface DeleteElementResult
  {
    type: 'delete';
    elementId: string;
  }

  const props = defineProps<Props>();

  const elements = computed(() => props.layer.objects);

  const formatTimestamp = (epoch: number): string =>
  {
    const date = new Date(epoch);
    return date.toLocaleString();
  };

  const handleDeleteElement = (elementId: string): void =>
  {
    const result: DeleteElementResult = {
      type: 'delete',
      elementId
    };
    closeDialog(result);
  };

  defineExpose({ returnValue: () => null });
</script>

<style scoped>
  @reference "tailwindcss";
</style>
