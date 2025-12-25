import type { App } from 'vue';
import { Capacitor } from '@capacitor/core';
import { useEmlService } from './useEmlService';
import { BLUETOOTH_EML_KEY } from '@/services/bluetooth/createBluetoothPlugin';
import type { IBluetoothConnection } from '@/services/bluetooth/types/IBluetoothConnection';
import { CapacitorBluetoothServerConnection } from '@/services/bluetooth/implementations/CapacitorBluetoothServerConnection';

export const createEmlPlugin = () =>
{
  return {
    install(app: App)
    {
      // Access EML Bluetooth client service directly from app context
      const bluetoothClientService = app._context.provides[BLUETOOTH_EML_KEY as symbol] as IBluetoothConnection | null;

      // Create server service for listening mode (only on native platforms)
      let bluetoothServerService: IBluetoothConnection | null = null;

      if (Capacitor.isNativePlatform())
      {
        try
        {
          bluetoothServerService = new CapacitorBluetoothServerConnection();
          console.log('📡 EML Plugin: Server service created');
        }
        catch (error)
        {
          console.warn('📡 EML Plugin: Could not create server service:', error);
        }
      }

      if (!bluetoothClientService && !bluetoothServerService)
      {
        console.error('📡 EML Plugin: No Bluetooth services available');
        return;
      }

      // Initialize EML service with both client and server services
      const { initialize } = useEmlService();
      initialize(bluetoothClientService, bluetoothServerService);

      console.log('📡 EML: Plugin installed and service initialized');
      console.log(`📡 EML: Client: ${bluetoothClientService ? 'yes' : 'no'}, Server: ${bluetoothServerService ? 'yes' : 'no'}`);
    }
  };
};
