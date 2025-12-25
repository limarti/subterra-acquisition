import type { BluetoothDevice } from '@/services/bluetooth/types/BluetoothDevice';

export interface IEmlTransport
{
  connect(device: BluetoothDevice): Promise<void>;
  disconnect(): Promise<void>;
  read(): void;
  listAvailableDevices(): Promise<BluetoothDevice[]>;
}
