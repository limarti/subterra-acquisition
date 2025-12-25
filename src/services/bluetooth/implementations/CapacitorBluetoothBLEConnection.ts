import type { IBluetoothConnection } from '../types/IBluetoothConnection';
import type { IBluetoothOptions } from '../types/IBluetoothOptions';
import type { BluetoothDevice } from '../types/BluetoothDevice';
import { BleClient } from '@capacitor-community/bluetooth-le';

// Default BLE UUIDs for SPP-like communication (common in GPS and serial modules)
const DEFAULT_BLE_SERVICE_UUID = '0000ffe0-0000-1000-8000-00805f9b34fb';
const DEFAULT_BLE_CHARACTERISTIC_UUID = '0000ffe1-0000-1000-8000-00805f9b34fb';

/**
 * iOS-specific Bluetooth BLE (Bluetooth Low Energy) connection implementation.
 * Uses the Capacitor Bluetooth LE plugin for native BLE communication.
 */
export class CapacitorBluetoothBLEConnection implements IBluetoothConnection
{
  private options: IBluetoothOptions = {};
  private isConnected = false;
  private bleDeviceId: string | null = null;
  private bleServiceUuid: string = DEFAULT_BLE_SERVICE_UUID;
  private bleCharacteristicUuid: string = DEFAULT_BLE_CHARACTERISTIC_UUID;

  provideOptions(options: IBluetoothOptions): void
  {
    this.options = options;
  }

  async connect(idDevice: string): Promise<void>
  {
    try
    {
      await BleClient.connect(idDevice, () =>
      {
        this.isConnected = false;
        this.bleDeviceId = null;
        this.options.onDisconnect?.();
      });

      this.bleDeviceId = idDevice;

      // Get services required to read/write operations
      const services = await BleClient.getServices(idDevice);

      const sppService = services.find(s =>
        s.characteristics.some(c => c.properties.write && c.properties.notify)
      ) || services.find(s => s.uuid === this.bleServiceUuid);

      if (!sppService)
      {
        throw new Error('No compatible BLE service found on device');
      }

      this.bleServiceUuid = sppService.uuid;

      const characteristic = sppService.characteristics.find(c =>
        c.properties.write && c.properties.notify
      ) || sppService.characteristics[0];

      if (!characteristic)
      {
        throw new Error('No compatible BLE characteristic found on device');
      }

      this.bleCharacteristicUuid = characteristic.uuid;

      this.isConnected = true;

      this.options.onConnect?.();
    }
    catch (error)
    {
      this.isConnected = false;
      this.bleDeviceId = null;

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

    if (!this.bleDeviceId)
    {
      const error = new Error('BLE device not connected');
      this.options.onError?.(error);
      throw error;
    }

    try
    {
      const dataView = new DataView(data.buffer);
      await BleClient.write(
        this.bleDeviceId,
        this.bleServiceUuid,
        this.bleCharacteristicUuid,
        dataView
      );
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

    if (!this.bleDeviceId)
    {
      const error = new Error('BLE device not connected');
      this.options.onError?.(error);
      throw error;
    }

    try
    {
      await BleClient.startNotifications(
        this.bleDeviceId,
        this.bleServiceUuid,
        this.bleCharacteristicUuid,
        (value: DataView) =>
        {
          const uint8Array = new Uint8Array(value.buffer);
          this.options.onData?.(uint8Array);
        }
      );
    }
    catch (error)
    {
      this.options.onError?.(error);
      throw error;
    }
  }

  stopReading(): void
  {
    if (!this.bleDeviceId)
    {
      return;
    }

    BleClient.stopNotifications(
      this.bleDeviceId,
      this.bleServiceUuid,
      this.bleCharacteristicUuid
    )
      .then(() =>
      {
        console.log('CapacitorBluetoothBLEConnection: Stopped notifications');
      })
      .catch((error) =>
      {
        console.error('CapacitorBluetoothBLEConnection: Error stopping notifications:', error);
      });
  }

  async disconnect(): Promise<void>
  {
    if (!this.isConnected)
    {
      console.warn('CapacitorBluetoothBLEConnection: Not connected');
      return;
    }

    if (!this.bleDeviceId)
    {
      return;
    }

    try
    {
      this.stopReading();
      await BleClient.disconnect(this.bleDeviceId);
      this.bleDeviceId = null;
      this.isConnected = false;
      console.log('CapacitorBluetoothBLEConnection: Disconnected');
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
      const devices: BluetoothDevice[] = [];

      await BleClient.requestLEScan(
        { allowDuplicates: false },
        (result) =>
        {
          const name = result.device.name || result.device.deviceId || result.localName;

          if (name && !devices.find((d) => d.id === result.device.deviceId))
          {
            devices.push({
              id: result.device.deviceId,
              name,
              connectionType: 'BLE' as const,
              uuids: result.uuids,
              ...result
            });
          }
        }
      );

      // Wait for 5 seconds to allow BLE devices to advertise their presence.
      // BLE scanning is asynchronous - devices don't appear instantly. They broadcast
      // advertisement packets at intervals (typically 20ms-10s). This delay ensures
      // we capture multiple advertising cycles from nearby devices before stopping the scan.
      // 5 seconds balances discovery completeness with user wait time.
      await new Promise((resolve) => setTimeout(resolve, 5000));

      await BleClient.stopLEScan();

      return devices;
    }
    catch (error)
    {
      console.error("Error scanning BLE:", error);
      throw error;
    }
  }
}
