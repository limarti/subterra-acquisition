import type { IBluetoothConnection } from '../types/IBluetoothConnection';
import type { IBluetoothOptions } from '../types/IBluetoothOptions';
import type { BluetoothDevice } from '../types/BluetoothDevice';

// Standard SPP UUID for serial communication
const SPP_UUID = '00001101-0000-1000-8000-00805F9B34FB';

/**
 * Bluetooth SPP (Serial Port Profile) connection implementation.
 * Uses cordova-plugin-bluetooth-classic-serial-port for native SPP communication.
 */
export class CapacitorBluetoothSPPConnection implements IBluetoothConnection
{
  private options: IBluetoothOptions = {};
  private isConnected = false;
  private connectedDeviceId: string | null = null;
  private isSubscribedToData = false;

  provideOptions(options: IBluetoothOptions): void
  {
    this.options = options;
  }

  async connect(deviceId: string): Promise<void>
  {
    try
    {
      const isEnabled = await this.checkBluetoothEnabled();
      if (!isEnabled)
      {
        const error = new Error('Bluetooth is not enabled');
        this.options.onError?.(error);
        throw error;
      }

      return new Promise<void>((resolve, reject) =>
      {
        bluetoothClassicSerial.connect(
          deviceId,
          [SPP_UUID],
          () =>
          {
            this.isConnected = true;
            this.connectedDeviceId = deviceId;
            this.options.onConnect?.();
            resolve();
          },
          (error) =>
          {
            this.isConnected = false;
            this.connectedDeviceId = null;
            const err = new Error(error);
            this.options.onError?.(err);
            reject(err);
          }
        );
      });
    }
    catch (error)
    {
      this.isConnected = false;
      this.connectedDeviceId = null;
      this.options.onError?.(error);
      throw error;
    }
  }

  async send(data: Uint8Array): Promise<void>
  {
    if (!this.isConnected || !this.connectedDeviceId)
    {
      const error = new Error('Cannot send data: Bluetooth not connected');
      this.options.onError?.(error);
      throw error;
    }

    return new Promise<void>((resolve, reject) =>
    {
      bluetoothClassicSerial.write(
        this.connectedDeviceId!,
        SPP_UUID,
        data,
        () => resolve(),
        (error) =>
        {
          const err = new Error(error);
          this.options.onError?.(err);
          reject(err);
        }
      );
    });
  }

  async read(): Promise<void>
  {
    if (!this.isConnected || !this.connectedDeviceId)
    {
      const error = new Error('Cannot read: Bluetooth not connected');
      this.options.onError?.(error);
      throw error;
    }

    if (this.isSubscribedToData)
    {
      console.warn('CapacitorBluetoothSPPConnection: Already subscribed to data');
      return;
    }

    this.isSubscribedToData = true;

    bluetoothClassicSerial.subscribeRawData(
      this.connectedDeviceId,
      SPP_UUID,
      (data: ArrayBuffer) =>
      {
        const uint8Array = new Uint8Array(data);
        this.options.onData?.(uint8Array);
      },
      (error) =>
      {
        this.isSubscribedToData = false;
        this.options.onError?.(new Error(error));
      }
    );
  }

  stopReading(): void
  {
    if (!this.isSubscribedToData || !this.connectedDeviceId)
    {
      return;
    }

    bluetoothClassicSerial.unsubscribeRawData(
      this.connectedDeviceId,
      SPP_UUID,
      () =>
      {
        this.isSubscribedToData = false;
      },
      (error) =>
      {
        console.error('CapacitorBluetoothSPPConnection: Error stopping data subscription', error);
        this.isSubscribedToData = false;
      }
    );
  }

  async disconnect(): Promise<void>
  {
    if (!this.isConnected || !this.connectedDeviceId)
    {
      console.warn('CapacitorBluetoothSPPConnection: Not connected');
      return;
    }

    const deviceId = this.connectedDeviceId;

    try
    {
      this.stopReading();

      await new Promise<void>((resolve, reject) =>
      {
        bluetoothClassicSerial.disconnect(
          deviceId,
          SPP_UUID,
          () =>
          {
            this.isConnected = false;
            this.connectedDeviceId = null;
            this.options.onDisconnect?.();
            resolve();
          },
          (error) =>
          {
            const err = new Error(error);
            this.options.onError?.(err);
            reject(err);
          }
        );
      });
    }
    catch (error)
    {
      this.isConnected = false;
      this.connectedDeviceId = null;
      this.options.onError?.(error);
      throw error;
    }
  }

  async listAvailableDevices(): Promise<BluetoothDevice[]>
  {
    try
    {
      const isEnabled = await this.checkBluetoothEnabled();
      if (!isEnabled)
      {
        throw new Error('Bluetooth is not enabled');
      }

      const pairedDevices = await this.listPairedDevices();
      const unpairedDevices = await this.discoverUnpairedDevices();

      const allDevices = [...pairedDevices, ...unpairedDevices];

      return allDevices.map(device => ({
        id: device.id || device.address,
        name: device.name,
        address: device.address
      })) as BluetoothDevice[];
    }
    catch (error)
    {
      console.error('CapacitorBluetoothSPPConnection: Error listing devices', error);
      throw error;
    }
  }

  private checkBluetoothEnabled(): Promise<boolean>
  {
    return new Promise((resolve) =>
    {
      bluetoothClassicSerial.isEnabled(
        () => resolve(true),
        () => resolve(false)
      );
    });
  }

  private listPairedDevices(): Promise<BluetoothClassicDevice[]>
  {
    return new Promise((resolve, reject) =>
    {
      bluetoothClassicSerial.list(
        (devices) => resolve(devices),
        (error) => reject(new Error(error))
      );
    });
  }

  private discoverUnpairedDevices(): Promise<BluetoothClassicDevice[]>
  {
    return new Promise((resolve, reject) =>
    {
      bluetoothClassicSerial.discoverUnpaired(
        (devices) => resolve(devices),
        (error) => reject(new Error(error))
      );
    });
  }
}
