export type BluetoothDevice = {
  id: string;
  name?: string;
  connectionType: 'SPP' | 'BLE';
  [key: string]: unknown;
};
