import { defineStore } from 'pinia';
import { ref, readonly } from 'vue';
import type { BluetoothDevice } from '@/services/bluetooth/types/BluetoothDevice';
import { EmlConnectionType } from '@/services/eml/types/EmlConnectionType.enum';

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
  const selectedBluetoothEmlDevice = ref<BluetoothDevice | null>(null);
  const emlConnectionType = ref<EmlConnectionType>(EmlConnectionType.DISABLED);

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

      // Load selected Bluetooth EML device
      const savedBluetoothEmlDevice = localStorage.getItem('gla-selected-bluetooth-eml-device');
      if (savedBluetoothEmlDevice)
      {
        selectedBluetoothEmlDevice.value = JSON.parse(savedBluetoothEmlDevice) as BluetoothDevice;
      }

      // Load EML connection type
      const savedEmlConnectionType = localStorage.getItem('gla-eml-connection-type');
      if (savedEmlConnectionType && Object.values(EmlConnectionType).includes(savedEmlConnectionType as EmlConnectionType))
      {
        emlConnectionType.value = savedEmlConnectionType as EmlConnectionType;
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

  const setSelectedBluetoothEmlDevice = (device: BluetoothDevice | null): void =>
  {
    const previousDevice = selectedBluetoothEmlDevice.value;

    try
    {
      selectedBluetoothEmlDevice.value = device;

      if (device === null)
      {
        localStorage.removeItem('gla-selected-bluetooth-eml-device');
      }
      else
      {
        localStorage.setItem('gla-selected-bluetooth-eml-device', JSON.stringify(device));
      }
    }
    catch (error)
    {
      // Revert on failure
      selectedBluetoothEmlDevice.value = previousDevice;
      console.error('Failed to save selected Bluetooth EML device to localStorage:', error);
      throw error;
    }
  };

  const setEmlConnectionType = (type: EmlConnectionType): void =>
  {
    const previousType = emlConnectionType.value;

    try
    {
      emlConnectionType.value = type;
      localStorage.setItem('gla-eml-connection-type', type);
    }
    catch (error)
    {
      // Revert on failure
      emlConnectionType.value = previousType;
      console.error('Failed to save EML connection type to localStorage:', error);
      throw error;
    }
  };

  loadFromStorage();

  return {
    // State
    units,
    selectedBluetoothGpsDevice: readonly(selectedBluetoothGpsDevice),
    selectedBluetoothEmlDevice: readonly(selectedBluetoothEmlDevice),
    emlConnectionType: readonly(emlConnectionType),

    // Actions
    setUnits,
    setSelectedBluetoothGpsDevice,
    setSelectedBluetoothEmlDevice,
    setEmlConnectionType
  };
});
