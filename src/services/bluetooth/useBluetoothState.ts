import { ref } from 'vue';
import { BleClient } from '@capacitor-community/bluetooth-le';
import { initializeBluetoothPermissions, wasPermissionDenied } from './initializeBluetoothPermissions';
import { BluetoothSerial } from '@awesome-cordova-plugins/bluetooth-serial';
import { Capacitor } from '@capacitor/core';

export const useBluetoothState = () =>
{
  const isBluetoothEnabled = ref(true);

  const checkBluetoothState = async (): Promise<void> =>
  {
    try
    {
      const platform = Capacitor.getPlatform();

      // Check SPP or BLE for android
      // For IOS check only BLE
      if (platform === 'android')
      {
        isBluetoothEnabled.value = await BluetoothSerial.isEnabled() || await BleClient.isEnabled();
      }
      else if (platform === 'ios')
      {
        isBluetoothEnabled.value = await BleClient.isEnabled();
      }
      else if (platform === 'web')
      {
        isBluetoothEnabled.value = true;
      }
    }
    catch (error)
    {
      isBluetoothEnabled.value = false;
    }
  };

  const requestPermissions = async (): Promise<void> =>
  {
    await initializeBluetoothPermissions();
  };

  const isPermissionDenied = (): boolean =>
  {
    return wasPermissionDenied();
  };

  return {
    isBluetoothEnabled,
    checkBluetoothState,
    requestPermissions,
    isPermissionDenied
  };
};
