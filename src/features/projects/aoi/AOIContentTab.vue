<template>
  <!-- Container for container queries -->
  <div class="flex flex-col flex-1 min-h-0 px-4 py-4"
       style="container-type: inline-size;">

    <!-- Results Section -->
    <div class="flex justify-between items-center pb-4">
      <h3 class="text-sm font-semibold text-white">
        {{ $t('project.results') }}
      </h3>
      <button class="action-button"
              disabled>
        <!-- Document Icon -->
        <svg class="w-4 h-4"
             viewBox="0 0 24 24"
             fill="none"
             xmlns="http://www.w3.org/2000/svg">
          <path d="M9 12H15M9 16H15M17 21H7C5.89543 21 5 20.1046 5 19V5C5 3.89543 5.89543 3 7 3H12.5858C12.851 3 13.1054 3.10536 13.2929 3.29289L18.7071 8.70711C18.8946 8.89464 19 9.149 19 9.41421V19C19 20.1046 18.1046 21 17 21Z"
                stroke="currentColor"
                stroke-width="1.5"
                stroke-linecap="round"
                stroke-linejoin="round" />
        </svg>
        {{ $t('project.add_result') }}
      </button>
    </div>

    <OverlayScrollbarsComponent class="flex-1 min-h-0">
      <div v-if="area.results.length > 0"
           class="grid gap-4 grid-cols-[repeat(auto-fill,minmax(9.35rem,1fr))]">
        <GridItem v-for="result in area.results"
                  :key="result.id"
                  :item="result"
                  :isSelected="isItemSelected(result.id)"
                  :isMultiSelectMode="isMultiSelectMode"
                  @click="handleItemClick"
                  @checkboxClick="handleCheckboxClick"
                  @longPress="handleItemLongPress" />
      </div>
      <div v-else
           class="h-full flex flex-col items-center justify-center gap-1 text-center">
        <p class="text-white font-medium">
          {{ $t('project.no_results') }}
        </p>
        <p class="text-text-secondary text-sm">
          {{ $t('project.no_results_hint') }}
        </p>
      </div>
    </OverlayScrollbarsComponent>
  </div>
</template>

<script setup lang="ts">
  import { watch } from 'vue';
  import GridItem from './GridItem.vue';
  import type { AreaOfInterest } from '../AreaOfInterest.type';
  import { useMultiSelect } from '@/common/composables/useMultiSelect';
  import { OverlayScrollbarsComponent } from 'overlayscrollbars-vue';

  interface Props
  {
    area: AreaOfInterest;
    idProject: string;
  }

  interface Emits
  {
    selectionChange: [selectedIds: Set<string>];
  }

  const props = defineProps<Props>();
  const emit = defineEmits<Emits>();

  const {
    idSelectedItems,
    isMultiSelectMode,
    isItemSelected,
    handleItemClick,
    handleCheckboxClick,
    handleItemLongPress,
  } = useMultiSelect();

  // Watch selection changes and emit to parent
  watch(idSelectedItems, (newSelection) =>
  {
    emit('selectionChange', new Set(newSelection));
  }, { deep: true });
</script>

<style scoped>
  @reference "../../../assets/base.css";

  .action-button
  {
    @apply flex items-center gap-1.5 text-sm text-white transition-colors;
  }

  .action-button:not(:disabled)
  {
    @apply cursor-pointer hover:text-white;
  }

  .action-button:disabled
  {
    @apply opacity-50;
  }
</style>
