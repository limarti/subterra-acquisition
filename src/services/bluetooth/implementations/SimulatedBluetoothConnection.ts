import type { IBluetoothConnection } from '../types/IBluetoothConnection';
import type { IBluetoothOptions } from '../types/IBluetoothOptions';
import type { BluetoothDevice } from '../types/BluetoothDevice';

const CONFIG = {
  CONNECTION_DELAY_MS: 500,
  DATA_INJECTION_INTERVAL_MS: 1000,
  FAKE_DATA_SIZE: 64
} as const;

export class SimulatedBluetoothConnection implements IBluetoothConnection
{
  private options: IBluetoothOptions = {};
  private isConnected = false;
  private isReading = false;
  private dataInjectionInterval: number | null = null;

  provideOptions(options: IBluetoothOptions): void
  {
    this.options = options;
  }

  async connect(idDevice: string): Promise<void>
  {
    if (this.isConnected)
    {
      return;
    }

    await new Promise(resolve => setTimeout(resolve, CONFIG.CONNECTION_DELAY_MS));

    this.isConnected = true;
    this.options.onConnect?.();
  }

  async send(data: Uint8Array): Promise<void>
  {
    if (!this.isConnected)
    {
      const error = new Error('Cannot send data: Bluetooth not connected');
      this.options.onError?.(error);
      throw error;
    }

    console.log(`SimulatedBluetoothConnection: Sent ${data.length} bytes`, data);
  }

  async read(): Promise<void>
  {
    if (!this.isConnected)
    {
      const error = new Error('Cannot read: Bluetooth not connected');
      this.options.onError?.(error);
      throw error;
    }

    if (this.isReading)
    {
      console.warn('SimulatedBluetoothConnection: Already reading');
      return;
    }

    this.isReading = true;
    this.startDataInjection();
  }

  stopReading(): void
  {
    this.isReading = false;
    this.stopDataInjection();
  }

  async disconnect(): Promise<void>
  {
    if (!this.isConnected)
    {
      console.warn('SimulatedBluetoothConnection: Not connected');
      return;
    }

    this.stopReading();
    this.isConnected = false;
    console.log('SimulatedBluetoothConnection: Disconnected');
    this.options.onDisconnect?.();
  }

  async listAvailableDevices(): Promise<BluetoothDevice[]>
  {
    await new Promise(resolve => setTimeout(resolve, CONFIG.CONNECTION_DELAY_MS));

    const mockDevices: BluetoothDevice[] = [
      { id: 'sim-1', name: 'Simulated GPS Device 1', connectionType: 'BLE', address: '00:11:22:33:44:55' },
      { id: 'sim-2', name: 'Simulated GPS Device 2', connectionType: 'BLE', address: '00:11:22:33:44:66' },
      { id: 'sim-3', name: 'Simulated Bluetooth Receiver', connectionType: 'BLE', address: '00:11:22:33:44:77' }
    ];

    return mockDevices;
  }

  private startDataInjection(): void
  {
    if (this.dataInjectionInterval !== null) return;

    this.dataInjectionInterval = window.setInterval(() =>
    {
      if (!this.isConnected || !this.isReading) return;

      const fakeData = this.generateFakeData();
      this.options.onData?.(fakeData);
    }, CONFIG.DATA_INJECTION_INTERVAL_MS);
  }

  private stopDataInjection(): void
  {
    if (this.dataInjectionInterval !== null)
    {
      clearInterval(this.dataInjectionInterval);
      this.dataInjectionInterval = null;
    }
  }

  private generateFakeData(): Uint8Array
  {
    // Generate a valid NMEA GGA sentence for GPS testing
    const nmeaSentence = this.generateNmeaGgaSentence();
    const encoder = new TextEncoder();
    return encoder.encode(nmeaSentence);
  }

  private generateNmeaGgaSentence(): string
  {
    // Generate realistic GPS coordinates that vary slightly over time
    const baseLatitude = 3436.223; // 34°36.223' S (ddmm.mmmm format)
    const baseLongitude = 5822.898; // 58°22.898' W (dddmm.mmmm format)

    // Add small random variations to simulate GPS movement
    const latitudeVariation = (Math.random() - 0.5) * 0.01;
    const longitudeVariation = (Math.random() - 0.5) * 0.01;

    const latitude = (baseLatitude + latitudeVariation).toFixed(3);
    const longitude = (baseLongitude + longitudeVariation).toFixed(3).padStart(9, '0');

    // Current UTC time
    const now = new Date();
    const hours = String(now.getUTCHours()).padStart(2, '0');
    const minutes = String(now.getUTCMinutes()).padStart(2, '0');
    const seconds = String(now.getUTCSeconds()).padStart(2, '0');
    const utcTime = `${hours}${minutes}${seconds}.00`;

    // Random fix quality: 1 (GPS_FIX) or 4 (RTK_FIX)
    const fixQuality = Math.random() > 0.1 ? 4 : 1;

    // Build GGA sentence (without checksum)
    const sentenceData = `GPGGA,${utcTime},${latitude},S,${longitude},W,${fixQuality},08,0.9,25.0,M,34.0,M,,`;

    // Calculate checksum
    const checksum = this.calculateNmeaChecksum(sentenceData);

    // Complete NMEA sentence with $ prefix, checksum, and CRLF
    return `$${sentenceData}*${checksum}\r\n`;
  }

  private calculateNmeaChecksum(sentence: string): string
  {
    let checksum = 0;

    for (let i = 0; i < sentence.length; i++)
    {
      checksum ^= sentence.charCodeAt(i);
    }

    return checksum.toString(16).toUpperCase().padStart(2, '0');
  }
}
