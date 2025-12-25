import { inject } from 'vue';
import { BLUETOOTH_SPP_KEY, BLUETOOTH_BLE_KEY } from './createBluetoothPlugin';
import type { IBluetoothConnection } from './types/IBluetoothConnection';
import type { IBluetoothOptions } from './types/IBluetoothOptions';

/**
 * Use Bluetooth SPP (Serial Port Profile) connection.
 * Available on Android. Returns null on iOS.
 */
export const useBluetoothSPP = (options: IBluetoothOptions): IBluetoothConnection | null =>
{
  const sppService = inject<IBluetoothConnection | null>(BLUETOOTH_SPP_KEY, null);

  if (sppService)
  {
    sppService.provideOptions?.(options);
  }

  return sppService;
};

/**
 * Use Bluetooth BLE (Bluetooth Low Energy) connection.
 * Available on both Android and iOS.
 */
export const useBluetoothBLE = (options: IBluetoothOptions): IBluetoothConnection =>
{
  const bleService = inject<IBluetoothConnection | null>(BLUETOOTH_BLE_KEY, null);

  if (!bleService)
  {
    throw new Error('Bluetooth BLE service not provided');
  }

  bleService.provideOptions?.(options);

  return bleService;
};
