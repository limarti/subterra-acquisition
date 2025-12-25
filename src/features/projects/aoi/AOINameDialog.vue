<template>
  <GeoButtonDialog :cancelText="$t('common.cancel')" :okText="$t('common.confirm')" @confirm="handleConfirm">
    <template #icon>
      <svg class="w-6 h-6"
           viewBox="0 0 24 24"
           fill="none"
           xmlns="http://www.w3.org/2000/svg">
        <path d="M12 2L2 7L12 12L22 7L12 2Z"
              stroke="white"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round" />
        <path d="M2 17L12 22L22 17"
              stroke="white"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round" />
        <path d="M2 12L12 17L22 12"
              stroke="white"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round" />
      </svg>
    </template>

    <template #title>
      {{ mode === 'rename' ? $t('project.renameAOI') : $t('project.createAOI') }}
    </template>

    <template #content>
      <label class="block text-xs text-text-secondary mb-2" for="aoiName">
        {{ $t('project.aoi_name') }}
      </label>

      <input id="aoiName"
             ref="inputRef"
             v-model="aoiName"
             type="text"
             class="w-full px-4 py-3 bg-background-lighter border border-border-gray rounded-md text-white focus:outline-none"
             @keyup.enter="handleConfirm">
    </template>
  </GeoButtonDialog>
</template>

<script setup lang="ts">
  import { ref, onMounted } from 'vue';
  import { closeDialog } from 'vue3-promise-dialog';
  import GeoButtonDialog from '@/generic/components/GeoButtonDialog.vue';

  interface Props
  {
    defaultName: string;
    mode?: 'create' | 'rename';
  }

  const props = withDefaults(defineProps<Props>(), {
    mode: 'create'
  });

  const aoiName = ref(props.defaultName);
  const inputRef = ref<HTMLInputElement | null>(null);

  const handleConfirm = () =>
  {
    if (aoiName.value.trim())
    {
      closeDialog(aoiName.value.trim());
    }
  };

  onMounted(() =>
  {
    inputRef.value?.focus();
    inputRef.value?.select();
  });

  defineExpose({ returnValue: () => {} });
</script>
