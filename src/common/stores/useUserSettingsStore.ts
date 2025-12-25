import { defineStore } from 'pinia';
import { ref, readonly } from 'vue';
import type { BluetoothDevice } from '@/services/bluetooth/types/BluetoothDevice';
import { GpsConnectionType } from '@/services/gps/types/GpsConnectionType.enum';

export enum Unit
{
  CENTIMETERS = 'cm',
  METERS = 'm',
  FEET = 'ft',
  INCHES = 'in'
}

export const useUserSettingsStore = defineStore('userSettings', () =>
{
  // ===== STATE =====
  const units = ref<Unit>(Unit.METERS);
  const selectedBluetoothGpsDevice = ref<BluetoothDevice | null>(null);
  const gpsConnectionType = ref<GpsConnectionType>(GpsConnectionType.BLUETOOTH);

  // ===== PRIVATE HELPERS =====
  const loadFromStorage = (): void =>
  {
    try
    {
      // Load units
      const savedUnits = localStorage.getItem('gla-user-unit');
      if (savedUnits && Object.values(Unit).includes(savedUnits as Unit))
      {
        units.value = savedUnits as Unit;
      }

      // Load selected Bluetooth GPS device
      const savedBluetoothDevice = localStorage.getItem('gla-selected-bluetooth-gps-device');
      if (savedBluetoothDevice)
      {
        selectedBluetoothGpsDevice.value = JSON.parse(savedBluetoothDevice) as BluetoothDevice;
      }

      // Load GPS connection type
      const savedGpsConnectionType = localStorage.getItem('gla-gps-connection-type');
      if (savedGpsConnectionType && Object.values(GpsConnectionType).includes(savedGpsConnectionType as GpsConnectionType))
      {
        gpsConnectionType.value = savedGpsConnectionType as GpsConnectionType;
      }
    }
    catch (error)
    {
      console.warn('Failed to load user settings from localStorage:', error);
    }
  };

  // ===== ACTIONS =====
  const setUnits = (newUnit: Unit): void =>
  {
    const previousUnit = units.value;

    try
    {
      units.value = newUnit;
      localStorage.setItem('gla-user-unit', units.value);
    }
    catch (error)
    {
      // Revert on failure
      units.value = previousUnit;
      console.error('Failed to save units to localStorage:', error);
      throw error;
    }
  };

  const setSelectedBluetoothGpsDevice = (device: BluetoothDevice | null): void =>
  {
    const previousDevice = selectedBluetoothGpsDevice.value;

    try
    {
      selectedBluetoothGpsDevice.value = device;

      if (device === null)
      {
        localStorage.removeItem('gla-selected-bluetooth-gps-device');
      }
      else
      {
        localStorage.setItem('gla-selected-bluetooth-gps-device', JSON.stringify(device));
      }
    }
    catch (error)
    {
      // Revert on failure
      selectedBluetoothGpsDevice.value = previousDevice;
      console.error('Failed to save selected Bluetooth GPS device to localStorage:', error);
      throw error;
    }
  };

  const setGpsConnectionType = (type: GpsConnectionType): void =>
  {
    const previousType = gpsConnectionType.value;

    try
    {
      gpsConnectionType.value = type;
      localStorage.setItem('gla-gps-connection-type', type);
    }
    catch (error)
    {
      // Revert on failure
      gpsConnectionType.value = previousType;
      console.error('Failed to save GPS connection type to localStorage:', error);
      throw error;
    }
  };

  loadFromStorage();

  return {
    // State
    units,
    selectedBluetoothGpsDevice: readonly(selectedBluetoothGpsDevice),
    gpsConnectionType: readonly(gpsConnectionType),

    // Actions
    setUnits,
    setSelectedBluetoothGpsDevice,
    setGpsConnectionType
  };
});
