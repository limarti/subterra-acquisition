<template>
  <GeoGenericDialog>
    <template #icon>
      <svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-white/50"/>
        <path d="M2 17L12 22L22 17" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-white/50"/>
        <path d="M2 12L12 17L22 12" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-white/50"/>
      </svg>
    </template>

    <template #title>
      Layers
    </template>

    <template #content>
      <div v-if="objects.length === 0" class="py-8 text-center text-text-secondary text-sm">
        No objects yet
      </div>

      <div v-for="obj in objects" :key="obj.id"
           class="flex items-center justify-between py-3 px-3 border-b border-border-gray hover:bg-background-darker-darker cursor-pointer transition"
           @click="toggleVisibility(obj.id)">
        <div class="flex items-center gap-3">
          <svg class="w-4 h-4 text-accent-primary" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M21 10C21 17 12 23 12 23C12 23 3 17 3 10C3 7.61305 3.94821 5.32387 5.63604 3.63604C7.32387 1.94821 9.61305 1 12 1C14.3869 1 16.6761 1.94821 18.364 3.63604C20.0518 5.32387 21 7.61305 21 10Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            <circle cx="12" cy="10" r="3" stroke="currentColor" stroke-width="2"/>
          </svg>
          <span class="text-white/80 text-sm">{{ obj.name }}</span>
        </div>

        <div class="w-5 h-5 rounded border flex items-center justify-center"
             :class="obj.visible ? 'border-accent-primary bg-accent-primary' : 'border-white/50'">
          <svg v-if="obj.visible" class="w-3 h-3 text-white" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M20 6L9 17L4 12" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </div>
      </div>
    </template>
  </GeoGenericDialog>
</template>

<script setup lang="ts">
  import { computed } from 'vue';
  import GeoGenericDialog from '@/generic/components/GeoGenericDialog.vue';
  import { useProjectContext } from '../useProjectContext';

  const { project, saveProject } = useProjectContext();

  const objects = computed(() => project.value?.objects ?? []);

  const toggleVisibility = async (objectId: string): Promise<void> =>
  {
    if (!project.value) return;

    const updatedObjects = (project.value.objects ?? []).map(obj =>
      obj.id === objectId ? { ...obj, visible: !obj.visible } : obj
    );

    await saveProject({
      ...project.value,
      objects: updatedObjects
    });
  };

  defineExpose({ returnValue: () => {} });
</script>

<style scoped>
  @reference "tailwindcss";
</style>
