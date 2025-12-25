import type { App } from 'vue';
import { Capacitor } from '@capacitor/core';
import { SimulatedBluetoothConnection } from './implementations/SimulatedBluetoothConnection';
import { CapacitorBluetoothSPPConnection } from './implementations/CapacitorBluetoothSPPConnection';
import type { IBluetoothConnection } from './types/IBluetoothConnection';
import { getAppMode } from '@/common/utils/appMode';

const BLUETOOTH_KEY = Symbol('BluetoothConnection');

export function createBluetoothPlugin()
{
  return {
    install(app: App)
    {
      const mode = getAppMode();
      const platform = Capacitor.getPlatform();

      let service: IBluetoothConnection | null = null;

      if (mode === 'web-preview' || mode === 'debug')
      {
        service = new SimulatedBluetoothConnection();
      }
      else if (platform === 'android')
      {
        service = new CapacitorBluetoothSPPConnection();
      }

      app.provide(BLUETOOTH_KEY, service);
    }
  };
}

export { BLUETOOTH_KEY };
