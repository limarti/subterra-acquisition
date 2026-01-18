<template>
  <div class="absolute top-4 right-4 z-[1001] pointer-events-auto">
    <GeoPopper placement="bottom-end" :offsetDistance="8">
      <button
        type="button"
        class="flex items-center gap-2 px-3 py-2 bg-background-darker border border-border-gray rounded-lg text-text-secondary hover:text-white hover:bg-background transition-colors cursor-pointer"
      >
        <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          <path d="M2 17L12 22L22 17" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          <path d="M2 12L12 17L22 12" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
        <span class="text-sm">{{ activeLayerName }}</span>
        <svg class="w-3 h-3" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M6 9L12 15L18 9" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </button>

      <template #content="{ close }">
        <div class="bg-background border border-accent-attention rounded shadow-lg min-w-56">
          <div v-if="layers.length === 0" class="py-6 px-4 text-center text-text-secondary text-sm">
            No layers
          </div>

          <div v-else class="max-h-64 overflow-y-auto">
            <div
              v-for="layer in layers"
              :key="layer.id"
              class="flex items-center gap-2 py-2 px-3 border-b border-border-gray hover:bg-background-darker transition"
            >
              <button
                type="button"
                class="flex items-center gap-2 flex-1 cursor-pointer"
                @click="handleSelectLayer(layer.id)"
              >
                <div
                  class="w-4 h-4 rounded-full border-2 flex items-center justify-center"
                  :class="layer.id === activeLayerId ? 'border-accent-primary' : 'border-white/50'"
                >
                  <div
                    v-if="layer.id === activeLayerId"
                    class="w-2 h-2 rounded-full bg-accent-primary"
                  />
                </div>
                <span class="text-white/80 text-sm truncate">{{ layer.name }}</span>
              </button>

              <button
                type="button"
                class="p-1 text-text-secondary hover:text-white transition cursor-pointer"
                :title="layer.visible ? 'Hide layer' : 'Show layer'"
                @click.stop="handleToggleVisibility(layer.id)"
              >
                <svg v-if="layer.visible" class="w-4 h-4" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M1 12C1 12 5 4 12 4C19 4 23 12 23 12C23 12 19 20 12 20C5 20 1 12 1 12Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                  <circle cx="12" cy="12" r="3" stroke="currentColor" stroke-width="2"/>
                </svg>
                <svg v-else class="w-4 h-4" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M17.94 17.94A10.07 10.07 0 0112 20C5 20 1 12 1 12A18.45 18.45 0 015.06 5.06M9.9 4.24A9.12 9.12 0 0112 4C19 4 23 12 23 12A18.5 18.5 0 0119.18 17.18M14.12 14.12A3 3 0 119.88 9.88" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                  <line x1="1" y1="1" x2="23" y2="23" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
              </button>

              <button
                type="button"
                class="p-1 text-text-secondary hover:text-red-400 transition cursor-pointer"
                title="Delete layer"
                @click.stop="handleDeleteLayer(layer.id, close)"
              >
                <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M3 6H5H21" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                  <path d="M8 6V4C8 3.46957 8.21071 2.96086 8.58579 2.58579C8.96086 2.21071 9.46957 2 10 2H14C14.5304 2 15.0391 2.21071 15.4142 2.58579C15.7893 2.96086 16 3.46957 16 4V6M19 6V20C19 20.5304 18.7893 21.0391 18.4142 21.4142C18.0391 21.7893 17.5304 22 17 22H7C6.46957 22 5.96086 21.7893 5.58579 21.4142C5.21071 21.0391 5 20.5304 5 20V6H19Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
              </button>
            </div>
          </div>

          <div class="border-t border-border-gray">
            <button
              v-if="activeLayer"
              type="button"
              class="w-full flex items-center gap-3 py-3 px-3 hover:bg-background-darker cursor-pointer transition text-white/80 text-sm"
              @click="handleViewElements(close)"
            >
              <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M9 5H7C5.89543 5 5 5.89543 5 7V19C5 20.1046 5.89543 21 7 21H17C18.1046 21 19 20.1046 19 19V7C19 5.89543 18.1046 5 17 5H15" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                <path d="M9 5C9 3.89543 9.89543 3 11 3H13C14.1046 3 15 3.89543 15 5V7H9V5Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                <path d="M9 12H15" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                <path d="M9 16H15" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
              <span>View elements</span>
            </button>

            <button
              type="button"
              class="w-full flex items-center gap-3 py-3 px-3 hover:bg-background-darker cursor-pointer transition text-white/80 text-sm"
              @click="handleAddLayer(close)"
            >
              <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 5V19M5 12H19" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
              <span>Add new layer</span>
            </button>
          </div>
        </div>
      </template>
    </GeoPopper>
  </div>
</template>

<script setup lang="ts">
  import { computed } from 'vue';
  import GeoPopper from '@/common/components/GeoPopper.vue';
  import type { ProjectObject } from '../objects/ProjectObject.type';

  interface Props
  {
    layers: ProjectObject[];
    activeLayerId: string | null;
  }

  interface Emits
  {
    'select-layer': [layerId: string];
    'delete-layer': [layerId: string];
    'toggle-visibility': [layerId: string];
    'add-layer': [];
    'view-elements': [layer: ProjectObject];
  }

  const props = defineProps<Props>();
  const emit = defineEmits<Emits>();

  const activeLayer = computed(() =>
    props.layers.find(layer => layer.id === props.activeLayerId)
  );

  const activeLayerName = computed(() =>
    activeLayer.value?.name ?? 'No layer'
  );

  const handleSelectLayer = (layerId: string): void =>
  {
    emit('select-layer', layerId);
  };

  const handleDeleteLayer = (layerId: string, close: () => void): void =>
  {
    emit('delete-layer', layerId);
    if (props.layers.length <= 1)
    {
      close();
    }
  };

  const handleToggleVisibility = (layerId: string): void =>
  {
    emit('toggle-visibility', layerId);
  };

  const handleAddLayer = (close: () => void): void =>
  {
    close();
    emit('add-layer');
  };

  const handleViewElements = (close: () => void): void =>
  {
    if (activeLayer.value)
    {
      close();
      emit('view-elements', activeLayer.value);
    }
  };
</script>

<style scoped>
  @reference "tailwindcss";
</style>
