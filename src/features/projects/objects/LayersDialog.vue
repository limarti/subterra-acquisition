<template>
  <GeoGenericDialog>
    <template #icon>
      <svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-white/50" />
        <path d="M2 17L12 22L22 17" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-white/50" />
        <path d="M2 12L12 17L22 12" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-white/50" />
      </svg>
    </template>

    <template #title>
      Layers
    </template>

    <template #content>
      <div v-if="layers.length === 0" class="py-8 text-center text-text-secondary text-sm">
        No layers yet
      </div>

      <div v-for="layer in layers"
           :key="layer.id"
           class="flex items-center justify-between py-3 px-3 border-b border-border-gray hover:bg-background-darker-darker cursor-pointer transition"
           @click="toggleVisibility(layer.id)">
        <div class="flex items-center gap-3">
          <svg class="w-4 h-4 text-accent-primary" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
            <path d="M2 17L12 22L22 17" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
            <path d="M2 12L12 17L22 12" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
          </svg>
          <span class="text-white/80 text-sm">{{ layer.name }}</span>
        </div>

        <div class="w-5 h-5 rounded border flex items-center justify-center"
             :class="layer.visible ? 'border-accent-primary bg-accent-primary' : 'border-white/50'">
          <svg v-if="layer.visible" class="w-3 h-3 text-white" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M20 6L9 17L4 12" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" />
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

  const layers = computed(() => project.value?.layers ?? []);

  const toggleVisibility = async (layerId: string): Promise<void> =>
  {
    if (!project.value) return;

    const updatedLayers = project.value.layers.map(layer =>
      layer.id === layerId ? { ...layer, visible: !layer.visible } : layer
    );

    await saveProject({
      ...project.value,
      layers: updatedLayers
    });
  };

  defineExpose({ returnValue: () => {} });
</script>

<style scoped>
  @reference "tailwindcss";
</style>
