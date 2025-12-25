import type { IGpsTransport } from '../types/IGpsTransport';
import type { BluetoothDevice } from '@/services/bluetooth/types/BluetoothDevice';
import type { useBluetoothSPP, useBluetoothBLE } from '@/services/bluetooth/useBluetoothConnection';

/**
 * Bluetooth GPS Transport
 *
 * Implements GPS transport over Bluetooth (SPP and BLE).
 * Wraps existing Bluetooth services and provides GPS-specific interface.
 */
export class BluetoothGpsTransport implements IGpsTransport
{
  private sppService: ReturnType<typeof useBluetoothSPP> | null;
  private bleService: ReturnType<typeof useBluetoothBLE> | null;
  private connectedDevice: BluetoothDevice | null = null;

  constructor(
    sppService: ReturnType<typeof useBluetoothSPP> | null,
    bleService: ReturnType<typeof useBluetoothBLE> | null
  )
  {
    if (!sppService && !bleService)
    {
      throw new Error('At least one Bluetooth service (SPP or BLE) must be provided');
    }

    this.sppService = sppService;
    this.bleService = bleService;
  }

  async connect(device: BluetoothDevice): Promise<void>
  {
    if (!device)
    {
      throw new Error('No valid GPS device provided');
    }

    const service = device.connectionType === 'SPP' ? this.sppService : this.bleService;

    if (!service)
    {
      throw new Error(`${device.connectionType} service not available`);
    }

    this.connectedDevice = device;
    try
    {
      await service.connect(device.id);
    }
    catch (error)
    {
      this.connectedDevice = null;
    }
  }

  async disconnect(): Promise<void>
  {
    if (!this.connectedDevice)
    {
      return;
    }

    const service = this.connectedDevice.connectionType === 'SPP' ? this.sppService : this.bleService;

    if (!service)
    {
      throw new Error(`${this.connectedDevice.connectionType} service not available`);
    }

    await service.disconnect();
    this.connectedDevice = null;
  }

  read(): void
  {
    if (!this.connectedDevice)
    {
      return;
    }

    const service = this.connectedDevice.connectionType === 'SPP' ? this.sppService : this.bleService;
    service?.read();
  }

  async listAvailableDevices(): Promise<BluetoothDevice[]>
  {
    const devices: BluetoothDevice[] = [];

    if (this.sppService)
    {
      const sppDevices = await this.sppService.listAvailableDevices();
      devices.push(...sppDevices);
    }

    if (this.bleService)
    {
      const bleDevices = await this.bleService.listAvailableDevices();
      devices.push(...bleDevices);
    }

    return devices;
  }
}
