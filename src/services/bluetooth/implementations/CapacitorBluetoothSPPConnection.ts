import type { IBluetoothConnection } from '../types/IBluetoothConnection';
import type { IBluetoothOptions } from '../types/IBluetoothOptions';
import type { BluetoothDevice } from '../types/BluetoothDevice';

// Standard SPP UUID for serial communication
const SPP_UUID = '00001101-0000-1000-8000-00805F9B34FB';

// ===== LOGGING =====
const LOG_PREFIX = '🔵 BT-SPP:';
const log = (message: string, ...args: unknown[]) => console.log(`${LOG_PREFIX} ${message}`, ...args);
const logWarn = (message: string, ...args: unknown[]) => console.warn(`${LOG_PREFIX} ${message}`, ...args);
const logError = (message: string, ...args: unknown[]) => console.error(`${LOG_PREFIX} ${message}`, ...args);

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
    log(`Connecting to device: ${deviceId}`);
    log(`Using SPP UUID: ${SPP_UUID}`);

    try
    {
      const isEnabled = await this.checkBluetoothEnabled();
      log(`Bluetooth enabled: ${isEnabled}`);

      if (!isEnabled)
      {
        const error = new Error('Bluetooth is not enabled');
        logError('Bluetooth adapter is not enabled');
        this.options.onError?.(error);
        throw error;
      }

      // Try secure connection first, then fall back to insecure
      try
      {
        await this.connectSecure(deviceId);
      }
      catch (secureError)
      {
        log('Secure connection failed, trying insecure connection...');
        await this.connectInsecure(deviceId);
      }
    }
    catch (error)
    {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logError(`Connect exception: ${errorMessage}`);
      this.isConnected = false;
      this.connectedDeviceId = null;
      this.options.onError?.(error);
      throw error;
    }
  }

  private connectSecure(deviceId: string): Promise<void>
  {
    return new Promise<void>((resolve, reject) =>
    {
      log('Trying SECURE connection (createRfcommSocketToServiceRecord)...');

      bluetoothClassicSerial.connect(
        deviceId,
        [SPP_UUID],
        () =>
        {
          log('Secure connection successful!');
          this.isConnected = true;
          this.connectedDeviceId = deviceId;
          this.options.onConnect?.();
          resolve();
        },
        (error) =>
        {
          logError(`Secure connection failed: ${error}`);
          this.isConnected = false;
          this.connectedDeviceId = null;
          reject(new Error(error));
        }
      );
    });
  }

  private connectInsecure(deviceId: string): Promise<void>
  {
    return new Promise<void>((resolve, reject) =>
    {
      log('Trying INSECURE connection (createInsecureRfcommSocketToServiceRecord)...');

      bluetoothClassicSerial.connectInsecure(
        deviceId,
        [SPP_UUID],
        () =>
        {
          log('Insecure connection successful!');
          this.isConnected = true;
          this.connectedDeviceId = deviceId;
          this.options.onConnect?.();
          resolve();
        },
        (error) =>
        {
          logError(`Insecure connection failed: ${error}`);
          logError(`Device ID was: ${deviceId}`);
          logError(`Tried both secure and insecure connections with SPP UUID`);
          logError(`Possible causes: device not paired, device busy, wrong Bluetooth profile, or device requires different UUID`);
          this.isConnected = false;
          this.connectedDeviceId = null;
          const err = new Error(error);
          this.options.onError?.(err);
          reject(err);
        }
      );
    });
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
    log('Starting data subscription...');

    if (!this.isConnected || !this.connectedDeviceId)
    {
      const error = new Error('Cannot read: Bluetooth not connected');
      logError('Cannot subscribe to data: not connected');
      this.options.onError?.(error);
      throw error;
    }

    if (this.isSubscribedToData)
    {
      logWarn('Already subscribed to data, skipping');
      return;
    }

    this.isSubscribedToData = true;
    log(`Subscribing to raw data on device: ${this.connectedDeviceId}`);

    bluetoothClassicSerial.subscribeRawData(
      this.connectedDeviceId,
      SPP_UUID,
      (data: ArrayBuffer) =>
      {
        const uint8Array = new Uint8Array(data);
        log(`Received ${uint8Array.length} bytes of data`);
        this.options.onData?.(uint8Array);
      },
      (error) =>
      {
        logError(`Data subscription error: ${error}`);
        this.isSubscribedToData = false;
        this.options.onError?.(new Error(error));
      }
    );

    log('Data subscription started');
  }

  stopReading(): void
  {
    if (!this.isSubscribedToData || !this.connectedDeviceId)
    {
      log('stopReading: not subscribed or not connected');
      return;
    }

    log('Stopping data subscription...');

    bluetoothClassicSerial.unsubscribeRawData(
      this.connectedDeviceId,
      SPP_UUID,
      () =>
      {
        log('Data subscription stopped');
        this.isSubscribedToData = false;
      },
      (error) =>
      {
        logError(`Error stopping data subscription: ${error}`);
        this.isSubscribedToData = false;
      }
    );
  }

  async disconnect(): Promise<void>
  {
    log('Disconnecting...');

    if (!this.isConnected || !this.connectedDeviceId)
    {
      logWarn('Not connected, nothing to disconnect');
      return;
    }

    const deviceId = this.connectedDeviceId;
    log(`Disconnecting from device: ${deviceId}`);

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
            log('Disconnected successfully');
            this.isConnected = false;
            this.connectedDeviceId = null;
            this.options.onDisconnect?.();
            resolve();
          },
          (error) =>
          {
            logError(`Disconnect error: ${error}`);
            const err = new Error(error);
            this.options.onError?.(err);
            reject(err);
          }
        );
      });
    }
    catch (error)
    {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logError(`Disconnect exception: ${errorMessage}`);
      this.isConnected = false;
      this.connectedDeviceId = null;
      this.options.onError?.(error);
      throw error;
    }
  }

  async listAvailableDevices(): Promise<BluetoothDevice[]>
  {
    log('Listing available devices...');

    try
    {
      const isEnabled = await this.checkBluetoothEnabled();
      log(`Bluetooth enabled: ${isEnabled}`);

      if (!isEnabled)
      {
        throw new Error('Bluetooth is not enabled');
      }

      log('Fetching paired devices...');
      const pairedDevices = await this.listPairedDevices();
      log(`Found ${pairedDevices.length} paired devices:`);
      pairedDevices.forEach(d =>
      {
        const deviceClass = d.class ? `0x${d.class.toString(16)}` : 'unknown';
        const majorClass = d.class ? this.getMajorDeviceClass(d.class) : 'unknown';
        log(`  - ${d.name || 'Unknown'} (${d.address}) [class: ${deviceClass}, type: ${majorClass}]`);
      });

      log('Discovering unpaired devices...');
      const unpairedDevices = await this.discoverUnpairedDevices();
      log(`Found ${unpairedDevices.length} unpaired devices:`);
      unpairedDevices.forEach(d =>
      {
        const deviceClass = d.class ? `0x${d.class.toString(16)}` : 'unknown';
        const majorClass = d.class ? this.getMajorDeviceClass(d.class) : 'unknown';
        log(`  - ${d.name || 'Unknown'} (${d.address}) [class: ${deviceClass}, type: ${majorClass}]`);
      });

      const allDevices = [...pairedDevices, ...unpairedDevices];

      const mappedDevices = allDevices.map(device => ({
        id: device.id || device.address,
        name: device.name,
        address: device.address
      })) as BluetoothDevice[];

      log(`Total devices: ${mappedDevices.length}`);
      return mappedDevices;
    }
    catch (error)
    {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logError(`Error listing devices: ${errorMessage}`);
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

  /**
   * Decode Bluetooth device class to human-readable major class
   * See: https://developer.android.com/reference/android/bluetooth/BluetoothClass.Device
   */
  private getMajorDeviceClass(deviceClass: number): string
  {
    // Major class is bits 8-12 (mask 0x1F00)
    const majorClass = (deviceClass >> 8) & 0x1F;

    switch (majorClass)
    {
      case 0x01: return 'Computer';
      case 0x02: return 'Phone';
      case 0x03: return 'LAN/Network';
      case 0x04: return 'Audio/Video';
      case 0x05: return 'Peripheral';
      case 0x06: return 'Imaging';
      case 0x07: return 'Wearable';
      case 0x08: return 'Toy';
      case 0x09: return 'Health';
      case 0x1F: return 'Uncategorized';
      default: return `Unknown(${majorClass})`;
    }
  }
}
