import { registerPlugin } from '@capacitor/core';

import type { BluetoothCommunicationPlugin } from './definitions';

const BluetoothCommunication = registerPlugin<BluetoothCommunicationPlugin>('BluetoothCommunication', {
  web: () => import('./web').then((m) => new m.BluetoothCommunicationWeb()),
});

export * from './definitions';
export { BluetoothCommunication };
