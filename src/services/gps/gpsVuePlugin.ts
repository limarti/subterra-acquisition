import type { App } from 'vue';
import { useGpsService } from './useGpsService';
import { BLUETOOTH_SPP_KEY, BLUETOOTH_BLE_KEY } from '@/services/bluetooth/createBluetoothPlugin';
import type { IBluetoothConnection } from '@/services/bluetooth/types/IBluetoothConnection';

export const createGpsPlugin = () =>
{
  return {
    install(app: App)
    {
      // Access Bluetooth services directly from app context
      const sppService = app._context.provides[BLUETOOTH_SPP_KEY as symbol] as IBluetoothConnection | null;
      const bleService = app._context.provides[BLUETOOTH_BLE_KEY as symbol] as IBluetoothConnection | null;

      if (!sppService && !bleService)
      {
        console.error('📍 GPS Plugin: No Bluetooth services available');
        return;
      }

      // Initialize GPS service with Bluetooth services
      const { initialize } = useGpsService();
      initialize(sppService, bleService);

      console.log('📍 GPS: Plugin installed and service initialized');
    }
  };
};
