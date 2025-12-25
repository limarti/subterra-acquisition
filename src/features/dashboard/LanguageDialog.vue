<template>
  <GeoGenericDialog>
    <template #icon>
      <svg class="w-6 h-6" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path stroke-linecap="round" stroke-linejoin="round" stroke="white" stroke-opacity="0.5" stroke-width="1.5" d="m10.5 21 5.25-11.25L21 21m-9-3h7.5M3 5.621a48.474 48.474 0 0 1 6-.371m0 0c1.12 0 2.233.038 3.334.114M9 5.25V3m3.334 2.364C11.176 10.658 7.69 15.08 3 17.502m9.334-12.138c.896.061 1.785.147 2.666.257m-4.589 8.495a18.023 18.023 0 0 1-3.827-5.802" />
      </svg>
    </template>

    <template #title>
      {{ $t('settings.language.label') }}
    </template>

    <template #content>
      <GeoDialogOption v-for="language in availableLanguages"
                       :key="language.code"
                       :title="language.name"
                       :isSelected="language.code === selectedLanguage"
                       @click="userSettingsStore.setLanguage(language.code)">
        <template #icon>
          <img :src="`/images/flags/${language.flag}.svg`"
               :alt="`${language.name} flag`"
               class="w-6 h-6">
        </template>
      </GeoDialogOption>
    </template>
  </GeoGenericDialog>
</template>

<script setup lang="ts">
  import { computed } from 'vue';
  import GeoGenericDialog from '@/generic/components/GeoGenericDialog.vue';
  import GeoDialogOption from '@/generic/components/GeoDialogOption.vue';
  import { useUserSettingsStore } from '@/common/stores/useUserSettingsStore';

  const userSettingsStore = useUserSettingsStore();
  const availableLanguages = computed(() => userSettingsStore.getAvailableLanguages());
  const selectedLanguage = computed(() => userSettingsStore.language);

  defineExpose({ returnValue: () => {} });
</script>
