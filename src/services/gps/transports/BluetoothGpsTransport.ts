import type { IGpsTransport } from '../types/IGpsTransport';
import type { BluetoothDevice } from '@/services/bluetooth/types/BluetoothDevice';
import type { IBluetoothConnection } from '@/services/bluetooth/types/IBluetoothConnection';

/**
 * Bluetooth GPS Transport
 *
 * Implements GPS transport over Bluetooth SPP (Serial Port Profile).
 * Wraps the Bluetooth service and provides GPS-specific interface.
 */
export class BluetoothGpsTransport implements IGpsTransport
{
  private service: IBluetoothConnection | null;
  private connectedDevice: BluetoothDevice | null = null;

  constructor(service: IBluetoothConnection | null)
  {
    if (!service)
    {
      throw new Error('Bluetooth service must be provided');
    }

    this.service = service;
  }

  async connect(device: BluetoothDevice): Promise<void>
  {
    if (!device)
    {
      throw new Error('No valid GPS device provided');
    }

    if (!this.service)
    {
      throw new Error('Bluetooth service not available');
    }

    this.connectedDevice = device;
    try
    {
      await this.service.connect(device.id);
    }
    catch (error)
    {
      this.connectedDevice = null;
      throw error;
    }
  }

  async disconnect(): Promise<void>
  {
    if (!this.connectedDevice)
    {
      return;
    }

    if (!this.service)
    {
      throw new Error('Bluetooth service not available');
    }

    await this.service.disconnect();
    this.connectedDevice = null;
  }

  read(): void
  {
    if (!this.connectedDevice || !this.service)
    {
      return;
    }

    this.service.read();
  }

  async listAvailableDevices(): Promise<BluetoothDevice[]>
  {
    if (!this.service)
    {
      return [];
    }

    return this.service.listAvailableDevices();
  }
}
