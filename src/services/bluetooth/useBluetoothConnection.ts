import { inject } from 'vue';
import { BLUETOOTH_GPS_KEY, BLUETOOTH_EML_KEY } from './createBluetoothPlugin';
import type { IBluetoothConnection } from './types/IBluetoothConnection';
import type { IBluetoothOptions } from './types/IBluetoothOptions';

/**
 * Use Bluetooth SPP connection for GPS.
 * Available on Android only.
 */
export const useBluetoothGps = (options: IBluetoothOptions): IBluetoothConnection | null =>
{
  const service = inject<IBluetoothConnection | null>(BLUETOOTH_GPS_KEY, null);

  if (service)
  {
    service.provideOptions?.(options);
  }

  return service;
};

/**
 * Use Bluetooth SPP connection for EML.
 * Available on Android only.
 */
export const useBluetoothEml = (options: IBluetoothOptions): IBluetoothConnection | null =>
{
  const service = inject<IBluetoothConnection | null>(BLUETOOTH_EML_KEY, null);

  if (service)
  {
    service.provideOptions?.(options);
  }

  return service;
};
