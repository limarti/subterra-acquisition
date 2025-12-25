<template>
  <GeoGenericDialog>
    <template #icon>
      <svg class="w-5 h-6" viewBox="0 0 28 29" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M14 16.25H26.25H28V18V26.75V28.5H26.25H12.25H1.75H0V26.75V16.25V2.25V0.5H1.75H10.5H12.25V2.25V14.5V16.25H14ZM21 18H17.5V21.5V22.375H15.75V21.5V18H12.25V21.5V22.375H10.5V21.5V18H7H6.125V16.25H7H10.5V12.75H7H6.125V11H7H10.5V7.5H7H6.125V5.75H7H10.5V2.25H1.75V16.25V26.75H12.25H26.25V18H22.75V21.5V22.375H21V21.5V18Z" fill="white" fill-opacity="0.5" />
      </svg>

    </template>

    <template #title>
      {{ $t('settings.units.label') }}
    </template>

    <template #content>
      <GeoDialogOption v-for="unit in Object.values(Unit)"
                       :key="unit"
                       :title="$t(`unit_description_${unit}`)"
                       :isSelected="unit === selectedUnit"
                       @click="selectUnit(unit)" />
    </template>
  </GeoGenericDialog>
</template>

<script setup lang="ts">
  import { computed } from 'vue';
  import GeoGenericDialog from '@/generic/components/GeoGenericDialog.vue';
  import GeoDialogOption from '@/generic/components/GeoDialogOption.vue';
  import { useUserSettingsStore, Unit } from '@/common/stores/useUserSettingsStore';

  const userSettingsStore = useUserSettingsStore();
  const selectedUnit = computed(() => userSettingsStore.units);

  const selectUnit = (unit: Unit) =>
  {
    userSettingsStore.setUnits(unit);
  };

  defineExpose({ returnValue: () => {} });
</script>
