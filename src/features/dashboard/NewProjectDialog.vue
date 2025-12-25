<template>
  <GeoButtonDialog :cancelText="$t('common.cancel')" :okText="$t('common.confirm')" @confirm="handleConfirm">
    <template #icon>
      <svg class="w-6 h-6" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M9 11L12 14L22 4" stroke="white" stroke-opacity="0.5" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
        <path d="M21 12V19C21 19.5304 20.7893 20.0391 20.4142 20.4142C20.0391 20.7893 19.5304 21 19 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V5C3 4.46957 3.21071 3.96086 3.58579 3.58579C3.96086 3.21071 4.46957 3 5 3H16" stroke="white" stroke-opacity="0.5" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
      </svg>
    </template>

    <template #title>
      {{ $t('dashboard.newProjectDialog.title') }}
    </template>

    <template #content>
      <div class="flex flex-col gap-4 w-full">
        <div class="flex flex-col gap-3">
          <div>
            <label class="block text-xs text-text-secondary mb-1" for="projectName">
              {{ $t('project.fields.name') }}
            </label>
            <input id="projectName"
                   ref="projectNameInput"
                   v-model="projectName"
                   type="text"
                   class="w-full px-3 py-2 bg-background-lighter-lighter text-white border border-border-gray rounded-md focus:outline-none focus:border-primary text-sm"
                   @keydown.enter="handleConfirm">
          </div>

          <p v-if="errorMessage" class="text-sm text-red-400 mt-1">
            {{ errorMessage }}
          </p>
        </div>
      </div>
    </template>
  </GeoButtonDialog>
</template>

<script setup lang="ts">
  import { ref, onMounted } from 'vue';
  import { useI18n } from 'vue-i18n';
  import GeoButtonDialog from '@/generic/components/GeoButtonDialog.vue';
  import { closeDialog } from 'vue3-promise-dialog';
  import { validateProjectName } from '@/features/projects/projectFieldsValidation';

  interface ProjectData
  {
    projectName: string;
  }

  const { t } = useI18n();

  const projectNameInput = ref<HTMLInputElement | null>(null);
  const projectName = ref('');
  const errorMessage = ref('');

  const handleConfirm = () =>
  {
    const error = validateProjectName(projectName.value);

    if (error)
    {
      errorMessage.value = t(error.key, error.params ?? {});
      return;
    }

    const result: ProjectData = {
      projectName: projectName.value.trim()
    };

    closeDialog(result);
  };

  onMounted(() =>
  {
    projectNameInput.value?.focus();
  });

  defineExpose({ returnValue: () => {} });
</script>
