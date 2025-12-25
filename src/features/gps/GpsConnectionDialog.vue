<template>
  <GeoGenericDialog>
    <template #icon>
      <svg class="w-6 h-6" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" fill="white" />
      </svg>
    </template>

    <template #title>
      {{ $t('gps.title') }}
    </template>

    <template #content>
      <div>
        <!-- Bluetooth adapter state warning -->
        <div v-if="!isBluetoothEnabled" class="mx-4 mt-4 p-3 bg-yellow-900 bg-opacity-20 border border-yellow-600 rounded-md">
          <div class="flex items-center gap-2 text-yellow-400 text-sm">
            <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
            </svg>
            <span>{{ $t('gps.bluetooth_disabled') }}</span>
          </div>
        </div>

        <!-- Permission error warning - first attempt -->
        <div v-if="permissionError && !isPermissionDenied() && isBluetoothEnabled" class="mx-4 mt-4 p-3 bg-red-900 bg-opacity-20 border border-red-600 rounded-md">
          <div class="flex flex-col gap-2">
            <div class="flex items-center gap-2 text-red-400 text-sm">
              <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
              </svg>
              <span>{{ $t('gps.permission_error') }}</span>
            </div>
          </div>
        </div>

        <!-- Permission denied - Android: button to open settings -->
        <div v-if="isPermissionDenied() && Capacitor.getPlatform() === 'android' && isBluetoothEnabled" class="mx-4 mt-4 p-3 bg-red-900 bg-opacity-20 border border-red-600 rounded-md">
          <div class="flex flex-col gap-2">
            <div class="flex items-center gap-2 text-red-400 text-sm">
              <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
              </svg>
              <span>{{ $t('gps.permission_denied') }}</span>
            </div>
            <button class="px-3 py-1.5 bg-red-600 hover:bg-red-700 rounded text-white text-sm transition"
                    @click="openAndroidSettings">
              {{ $t('gps.open_settings') }}
            </button>
          </div>
        </div>

        <!-- Permission denied - iOS: descriptive message only -->
        <div v-if="isPermissionDenied() && Capacitor.getPlatform() === 'ios' && isBluetoothEnabled" class="mx-4 mt-4 p-3 bg-red-900 bg-opacity-20 border border-red-600 rounded-md">
          <div class="flex flex-col gap-2">
            <div class="flex items-center gap-2 text-red-400 text-sm">
              <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
              </svg>
              <span class="font-medium">{{ $t('gps.permission_denied') }}</span>
            </div>
            <p class="text-white text-xs leading-relaxed">
              {{ $t('gps.permission_denied_help_ios') }}
            </p>
          </div>
        </div>

        <div class="text-gray-400 text-sm px-4 pt-4">
          {{ $t('gps.paired_devices') }}:
        </div>

        <div class="p-4">
          <button v-for="device in devices"
                  :key="device.id"
                  class="w-full px-4 py-3 mb-2 text-left bg-background-lighter border border-border-gray rounded-md text-gray-200 transition disabled:opacity-50 disabled:cursor-not-allowed enabled:cursor-pointer enabled:hover:bg-background-lighter-lighter"
                  :disabled="isRefreshing"
                  @click="handleDeviceClick(device)">
            {{ device.name || device.id }}
          </button>
        </div>

        <div class="p-2">
          <button class="w-full py-2 bg-background-lighter border rounded-md text-gray-200 transition disabled:opacity-50 disabled:cursor-not-allowed enabled:cursor-pointer enabled:hover:bg-background-lighter-lighter"
                  :disabled="isRefreshing"
                  @click="handleRefresh">
            {{ isRefreshing ? $t('gps.refreshing') : $t('gps.refresh_devices') }}
          </button>
        </div>
      </div>
    </template>
  </GeoGenericDialog>
</template>

<script setup lang="ts">
  import { ref, onMounted } from 'vue';
  import { closeDialog } from 'vue3-promise-dialog';
  import { Capacitor } from '@capacitor/core';
  import { AndroidSettings, NativeSettings } from 'capacitor-native-settings';
  import GeoGenericDialog from '@/generic/components/GeoGenericDialog.vue';
  import { useGpsService } from '@/services/gps/useGpsService';
  import { useUserSettingsStore } from '@/common/stores/useUserSettingsStore';
  import { useBluetoothState } from '@/services/bluetooth/useBluetoothState';
  import type { BluetoothDevice } from '@/services/bluetooth/types/BluetoothDevice';

  const isRefreshing = ref(false);
  const devices = ref<any[]>([]);
  const permissionError = ref(false);

  const gpsService = useGpsService();
  const userSettingsStore = useUserSettingsStore();
  const { isBluetoothEnabled, checkBluetoothState, requestPermissions, isPermissionDenied } = useBluetoothState();

  const loadDevices = async () =>
  {
    try
    {
      await requestPermissions();
      permissionError.value = false;

      const pairedDevices = await gpsService.listAvailableDevices();
      devices.value = pairedDevices;
    }
    catch (error)
    {
      permissionError.value = true;
      devices.value = [];
    }
  };

  const handleRefresh = async () =>
  {
    isRefreshing.value = true;
    devices.value = [];

    await checkBluetoothState();
    await loadDevices();

    isRefreshing.value = false;
  };

  const handleDeviceClick = (device: BluetoothDevice) =>
  {
    userSettingsStore.setSelectedBluetoothGpsDevice(device);
    closeDialog();
  };

  const openAndroidSettings = async () =>
  {
    try
    {
      await NativeSettings.openAndroid({ option: AndroidSettings.ApplicationDetails });
    }
    catch (error)
    {
      console.error('Error opening app settings', error);
    }
  };

  onMounted(async () =>
  {
    await checkBluetoothState();
    await handleRefresh();
  });

  defineExpose({ returnValue: () => {} });
</script>
