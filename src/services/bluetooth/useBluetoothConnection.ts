import { inject } from 'vue';
import { BLUETOOTH_KEY } from './createBluetoothPlugin';
import type { IBluetoothConnection } from './types/IBluetoothConnection';
import type { IBluetoothOptions } from './types/IBluetoothOptions';

/**
 * Use Bluetooth SPP (Serial Port Profile) connection.
 * Available on Android only.
 */
export const useBluetooth = (options: IBluetoothOptions): IBluetoothConnection | null =>
{
  const service = inject<IBluetoothConnection | null>(BLUETOOTH_KEY, null);

  if (service)
  {
    service.provideOptions?.(options);
  }

  return service;
};
