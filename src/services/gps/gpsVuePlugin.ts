import type { App } from 'vue';
import { useGpsService } from './useGpsService';
import { BLUETOOTH_GPS_KEY } from '@/services/bluetooth/createBluetoothPlugin';
import type { IBluetoothConnection } from '@/services/bluetooth/types/IBluetoothConnection';

export const createGpsPlugin = () =>
{
  return {
    install(app: App)
    {
      // Access GPS Bluetooth service directly from app context
      const bluetoothService = app._context.provides[BLUETOOTH_GPS_KEY as symbol] as IBluetoothConnection | null;

      if (!bluetoothService)
      {
        console.error('📍 GPS Plugin: No Bluetooth service available');
        return;
      }

      // Initialize GPS service with Bluetooth service
      const { initialize } = useGpsService();
      initialize(bluetoothService);

      console.log('📍 GPS: Plugin installed and service initialized');
    }
  };
};
