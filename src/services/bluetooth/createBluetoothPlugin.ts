import type { App } from 'vue';
import { Capacitor } from '@capacitor/core';
import { SimulatedBluetoothConnection } from './implementations/SimulatedBluetoothConnection';
import { CapacitorBluetoothSPPConnection } from './implementations/CapacitorBluetoothSPPConnection';
import type { IBluetoothConnection } from './types/IBluetoothConnection';
import { getAppMode } from '@/common/utils/appMode';

const BLUETOOTH_GPS_KEY = Symbol('BluetoothGpsConnection');
const BLUETOOTH_EML_KEY = Symbol('BluetoothEmlConnection');

export function createBluetoothPlugin()
{
  return {
    install(app: App)
    {
      const mode = getAppMode();
      const platform = Capacitor.getPlatform();

      let gpsService: IBluetoothConnection | null = null;
      let emlService: IBluetoothConnection | null = null;

      if (mode === 'web-preview' || mode === 'debug')
      {
        gpsService = new SimulatedBluetoothConnection();
        emlService = new SimulatedBluetoothConnection();
      }
      else if (platform === 'android')
      {
        gpsService = new CapacitorBluetoothSPPConnection();
        emlService = new CapacitorBluetoothSPPConnection();
      }

      app.provide(BLUETOOTH_GPS_KEY, gpsService);
      app.provide(BLUETOOTH_EML_KEY, emlService);
    }
  };
}

export { BLUETOOTH_GPS_KEY, BLUETOOTH_EML_KEY };
