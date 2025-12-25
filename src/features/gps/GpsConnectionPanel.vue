<template>
  <Card :title="$t('gps.title')">

    <div class="flex flex-col rounded-b-sm p-4 gap-2">

      <!-- Connection Type Selector -->
      <div class="flex justify-center gap-1">
        <button class="btn-selector"
                :class="connectionType === GpsConnectionType.DISABLED ? 'btn-selector-active' : 'btn-selector-inactive'"
                @click="handleConnectionTypeChange(GpsConnectionType.DISABLED)">
          {{ $t('common.disabled') }}
        </button>
        <button class="btn-selector"
                :class="connectionType === GpsConnectionType.BLUETOOTH ? 'btn-selector-active' : 'btn-selector-inactive'"
                @click="handleConnectionTypeChange(GpsConnectionType.BLUETOOTH)">
          {{ $t('gps.connection_type_bluetooth') }}
        </button>
      </div>

      <template v-if="connectionType === GpsConnectionType.BLUETOOTH">
        <div class="w-full">
          <button class="flex items-center cursor-pointer justify-between w-full px-3 py-2 rounded-md border border-border-gray"
                  @click="() => open(GpsConnectionDialog)">
            <div class="flex items-center gap-2 text-gray-200">
              <svg class="w-6 h-6" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M19.5282 6.5C20.4641 8.11795 20.9998 9.99642 20.9998 12C20.9998 14.0036 20.4641 15.882 19.5282 17.5M16.3262 9C16.7581 9.90926 16.9998 10.9264 16.9998 12C16.9998 13.0736 16.7581 14.0907 16.3262 15M3 17L8 12M8 12L13 7L8 2V12ZM8 12V22L13 17L8 12ZM8 12L3 7"
                      stroke="var(--color-accent-primary)"
                      stroke-width="1.5"
                      stroke-linecap="round"
                      stroke-linejoin="round" />
              </svg>

              <span>{{ $t('gps.device') }}</span>
            </div>

            <div class="flex items-center gap-1 text-gray-400">
              <span v-if="selectedDevice">{{ selectedDevice.name || selectedDevice.id }}</span>
              <span v-else>{{ $t('gps.no_device_selected') }}</span>

              <svg class="w-6 h-6" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M9 18L15 12L9 6"
                      stroke="white"
                      stroke-width="1"
                      stroke-linecap="round"
                      stroke-linejoin="round" />
              </svg>
            </div>
          </button>
        </div>
      </template>
    </div>
  </Card>
</template>

<script setup lang="ts">
  import { computed } from 'vue';
  import { useDialog } from '@/generic/composables/useDialog';
  import { useUserSettingsStore } from '@/common/stores/useUserSettingsStore';
  import { GpsConnectionType } from '@/services/gps/types/GpsConnectionType.enum';
  import Card from '@/features/dashboard/Card.vue';
  import GpsConnectionDialog from './GpsConnectionDialog.vue';

  const { open } = useDialog();
  const userSettingsStore = useUserSettingsStore();

  const selectedDevice = computed(() => userSettingsStore.selectedBluetoothGpsDevice);
  const connectionType = computed(() => userSettingsStore.gpsConnectionType);

  const handleConnectionTypeChange = (type: GpsConnectionType) =>
  {
    userSettingsStore.setGpsConnectionType(type);
  };
</script>
