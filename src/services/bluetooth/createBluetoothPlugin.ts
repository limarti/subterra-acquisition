import type { App } from 'vue';
import { Capacitor } from '@capacitor/core';
import { SimulatedBluetoothConnection } from './implementations/SimulatedBluetoothConnection';
import { CapacitorBluetoothSPPConnection } from './implementations/CapacitorBluetoothSPPConnection';
import { CapacitorBluetoothBLEConnection } from './implementations/CapacitorBluetoothBLEConnection';
import type { IBluetoothConnection } from './types/IBluetoothConnection';
import { getAppMode } from '@/common/utils/appMode';

const BLUETOOTH_SPP_KEY = Symbol('BluetoothSPPConnection');
const BLUETOOTH_BLE_KEY = Symbol('BluetoothBLEConnection');

export function createBluetoothPlugin()
{
  return {
    install(app: App)
    {
      const mode = getAppMode();
      const platform = Capacitor.getPlatform();

      let sppService: IBluetoothConnection | null = null;
      let bleService: IBluetoothConnection | null = null;

      if (mode === 'web-preview' || mode === 'debug')
      {
        bleService = new SimulatedBluetoothConnection();
      }
      else
      {
        // Production mode: platform-specific services
        if (platform === 'android')
        {
          sppService = new CapacitorBluetoothSPPConnection();
          bleService = new CapacitorBluetoothBLEConnection();
        }
        else if (platform === 'ios')
        {
          // SPP not available on iOS
          bleService = new CapacitorBluetoothBLEConnection();
        }
      }

      app.provide(BLUETOOTH_SPP_KEY, sppService);
      app.provide(BLUETOOTH_BLE_KEY, bleService);
    }
  };
}

export { BLUETOOTH_SPP_KEY, BLUETOOTH_BLE_KEY };
