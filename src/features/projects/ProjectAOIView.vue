<template>
  <div class="h-full flex flex-col">
    <div v-if="area" class="flex-1 min-h-0">
      <AOIContentTab :area="area"
                     :idProject="project!.id"
                     @selectionChange="handleSelectionChange" />
    </div>
    <div v-else class="flex items-center justify-center h-full">
      <p class="text-text-secondary">
        {{ $t('project.aoiNotFound') }}
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { computed, ref, watch } from 'vue';
  import { useRoute } from 'vue-router';
  import AOIContentTab from './aoi/AOIContentTab.vue';
  import { useProjectContext } from './useProjectContext';

  const route = useRoute();
  const { project } = useProjectContext();

  const idSelectedItems = ref<Set<string>>(new Set());

  const idAOI = computed(() => route.params.idAOI as string);

  const area = computed(() =>
  {
    if (!project.value || !idAOI.value) return null;
    return project.value.areas.find(a => a.id === idAOI.value) ?? null;
  });

  const handleSelectionChange = (selectedIds: Set<string>) =>
  {
    idSelectedItems.value = selectedIds;
  };

  // Clear selection when AOI changes
  watch(idAOI, () =>
  {
    idSelectedItems.value.clear();
  });
</script>
