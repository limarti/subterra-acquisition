import { ref } from 'vue';
import { Capacitor } from '@capacitor/core';

let permissionDenied = false;

export const useBluetoothState = () =>
{
  const isBluetoothEnabled = ref(true);

  const checkBluetoothState = async (): Promise<void> =>
  {
    const platform = Capacitor.getPlatform();

    if (platform === 'android')
    {
      try
      {
        isBluetoothEnabled.value = await new Promise<boolean>((resolve) =>
        {
          bluetoothClassicSerial.isEnabled(
            () => resolve(true),
            () => resolve(false)
          );
        });
      }
      catch (error)
      {
        isBluetoothEnabled.value = false;
      }
    }
    else if (platform === 'web')
    {
      isBluetoothEnabled.value = true;
    }
    else
    {
      // iOS not supported for SPP without MFi certification
      isBluetoothEnabled.value = false;
    }
  };

  const requestPermissions = async (): Promise<void> =>
  {
    const platform = Capacitor.getPlatform();

    if (platform === 'android')
    {
      try
      {
        // The plugin handles permissions internally when calling list/discover
        // We can trigger permission request by calling list
        await new Promise<void>((resolve, reject) =>
        {
          bluetoothClassicSerial.list(
            () =>
            {
              permissionDenied = false;
              resolve();
            },
            (error) =>
            {
              permissionDenied = true;
              reject(new Error(error));
            }
          );
        });
      }
      catch (error)
      {
        permissionDenied = true;
        throw error;
      }
    }
  };

  const isPermissionDenied = (): boolean =>
  {
    return permissionDenied;
  };

  return {
    isBluetoothEnabled,
    checkBluetoothState,
    requestPermissions,
    isPermissionDenied
  };
};
