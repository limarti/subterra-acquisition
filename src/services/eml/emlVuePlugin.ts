import type { App } from 'vue';
import { useEmlService } from './useEmlService';
import { BLUETOOTH_EML_KEY } from '@/services/bluetooth/createBluetoothPlugin';
import type { IBluetoothConnection } from '@/services/bluetooth/types/IBluetoothConnection';

export const createEmlPlugin = () =>
{
  return {
    install(app: App)
    {
      // Access EML Bluetooth service directly from app context
      const bluetoothService = app._context.provides[BLUETOOTH_EML_KEY as symbol] as IBluetoothConnection | null;

      if (!bluetoothService)
      {
        console.error('📡 EML Plugin: No Bluetooth service available');
        return;
      }

      // Initialize EML service with Bluetooth service
      const { initialize } = useEmlService();
      initialize(bluetoothService);

      console.log('📡 EML: Plugin installed and service initialized');
    }
  };
};
