import type { IBluetoothConnection } from '../types/IBluetoothConnection';
import type { IBluetoothOptions } from '../types/IBluetoothOptions';
import type { BluetoothDevice } from '../types/BluetoothDevice';
import { BluetoothSerial } from '@awesome-cordova-plugins/bluetooth-serial';
import type { Subscription } from 'rxjs';

/**
 * Android-specific Bluetooth SPP (Serial Port Profile) connection implementation.
 * Uses the Cordova Bluetooth Serial plugin for native SPP communication.
 */
export class CapacitorBluetoothSPPConnection implements IBluetoothConnection
{
  private options: IBluetoothOptions = {};
  private isConnected = false;
  private connectSubscription: Subscription | null = null;
  private sppSubscription: Subscription | null = null;

  provideOptions(options: IBluetoothOptions): void
  {
    this.options = options;
  }

  async connect(idDevice: string): Promise<void>
  {
    try
    {
      const isEnabled = await BluetoothSerial.isEnabled();
      if (!isEnabled)
      {
        const error = new Error('Bluetooth is not enabled');
        this.options.onError?.(error);
        throw error;
      }

      return new Promise<void>((resolve, reject) =>
      {
        this.connectSubscription = BluetoothSerial.connect(idDevice).subscribe({
          next: () =>
          {
            this.isConnected = true;
            this.options.onConnect?.();
            resolve();
          },
          error: (err) =>
          {
            this.isConnected = false;
            this.options.onError?.(err);
            reject(err);
          },
        });
      });
    }
    catch (error)
    {
      this.isConnected = false;
      this.options.onError?.(error);
      throw error;
    }
  }

  async send(data: Uint8Array): Promise<void>
  {
    if (!this.isConnected)
    {
      const error = new Error('Cannot send data: Bluetooth not connected');
      this.options.onError?.(error);
      throw error;
    }

    try
    {
      await BluetoothSerial.write(data);
    }
    catch (error)
    {
      this.options.onError?.(error);
      throw error;
    }
  }

  async read(): Promise<void>
  {
    if (!this.isConnected)
    {
      const error = new Error('Cannot read: Bluetooth not connected');
      this.options.onError?.(error);
      throw error;
    }

    if (this.sppSubscription)
    {
      console.warn('CapacitorBluetoothSPPConnection: Already subscribed to data');
      return;
    }

    this.sppSubscription = BluetoothSerial.subscribeRawData().subscribe({
      next: (data: ArrayBuffer) =>
      {
        const uint8Array = new Uint8Array(data);
        this.options.onData?.(uint8Array);
      },
      error: (error) =>
      {
        this.options.onError?.(error);
      }
    });
  }

  stopReading(): void
  {
    if (this.sppSubscription)
    {
      this.sppSubscription.unsubscribe();
      this.sppSubscription = null;
    }
  }

  async disconnect(): Promise<void>
  {
    if (!this.isConnected)
    {
      console.warn('CapacitorBluetoothSPPConnection: Not connected');
      return;
    }

    try
    {
      this.connectSubscription?.unsubscribe();
      this.connectSubscription = null;

      this.stopReading();
      await BluetoothSerial.disconnect();
      this.isConnected = false;
      this.options.onDisconnect?.();
    }
    catch (error)
    {
      this.options.onError?.(error);
      throw error;
    }
  }

  async listAvailableDevices(): Promise<BluetoothDevice[]>
  {
    try
    {
      const isEnabled = await BluetoothSerial.isEnabled();
      if (!isEnabled)
      {
        throw new Error('Bluetooth is not enabled');
      }

      const pairedDevices = await BluetoothSerial.list();
      const unpairedDevices = await BluetoothSerial.discoverUnpaired();

      const allDevices = [...pairedDevices, ...unpairedDevices];

      return allDevices.map(device => ({
        ...device,
        connectionType: 'SPP' as const
      })) as BluetoothDevice[];
    }
    catch (error)
    {
      console.error('CapacitorBluetoothSPPConnection: Error listing paired devices', error);
      throw error;
    }
  }
}
