import { WebPlugin } from '@capacitor/core';

import type { BluetoothCommunicationPlugin } from './definitions';

export interface BluetoothDevice {
  name: string;
  address: string;
}

export interface DataReceivedResult {
  data: string;
}
export type DataReceivedCallback = (result: DataReceivedResult) => void;

export class BluetoothCommunicationWeb extends WebPlugin implements BluetoothCommunicationPlugin {
  async initialize(): Promise<void> {
    console.log('[Web] Bluetooth initialized (stub).');
  }

  async enableBluetooth(): Promise<void> {
    console.log('[Web] Enable Bluetooth is not supported on the web.');
    throw this.unavailable('Bluetooth is not supported on the web.');
  }

  async scanDevices(): Promise<{ devices: Array<{ name: string; address: string }> }> {
    console.log('[Web] Scanning devices (stub).');
    return { devices: [] }; // Return an empty list
  }

  async startServer(): Promise<void> {
    console.log('[Web] Start Server is not supported on the web.');
    throw this.unavailable('Bluetooth is not supported on the web.');
  }

  async stopServer(): Promise<void> {
    console.log('[Web] Stop Server is not supported on the web.');
    throw this.unavailable('Bluetooth is not supported on the web.');
  }

  async connect(options: { address: string }): Promise<void> {
    console.log(`[Web] Connecting to device with address: ${options.address} (stub).`);
    throw this.unavailable('Bluetooth connection is not supported on the web.');
  }

  async disconnect(): Promise<void> {
    console.log('[Web] Disconnecting (stub).');
  }

  async sendData(options: { data: string }): Promise<void> {
    console.log(`[Web] Sending data: ${options.data} (stub).`);
    throw this.unavailable('Bluetooth data transfer is not supported on the web.');
  }

  addListener(eventName: 'dataReceived', listenerFunc: (data: any) => void): any {
    console.log(`BluetoothCommunicationWeb: addListener called for event ${eventName}`);
    return super.addListener(eventName, listenerFunc);
  }

}

const BluetoothCommunication = new BluetoothCommunicationWeb();
export { BluetoothCommunication };