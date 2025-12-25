import type { IBluetoothOptions } from "./IBluetoothOptions";
import type { BluetoothDevice } from "./BluetoothDevice";

export interface IBluetoothConnection
{
  connect(idDevice: string): Promise<void>;
  send(data: Uint8Array): Promise<void>;
  read(): Promise<void>;
  stopReading(): void;
  disconnect(): Promise<void>;
  provideOptions?(options: IBluetoothOptions): void;
  listAvailableDevices(): Promise<BluetoothDevice[]>;
}
