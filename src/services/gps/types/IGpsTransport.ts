import type { BluetoothDevice } from '@/services/bluetooth/types/BluetoothDevice';

/**
 * GPS Transport Interface
 *
 * Provides abstraction for GPS connection transports.
 *
 * Transport implementations handle:
 * - Device connection/disconnection
 * - Data reception from GPS device
 * - Connection state management
 *
 * The GPS service handles:
 * - NMEA parsing
 * - Data distribution to subscribers
 * - Automatic reconnection logic
 */
export interface IGpsTransport
{
  /**
   * Connect to a GPS device
   * @param device - Device to connect to
   * @throws Error if connection fails
   */
  connect(device: BluetoothDevice): Promise<void>;

  /**
   * Disconnect from GPS device
   */
  disconnect(): Promise<void>;

  /**
   * Start reading data from connected device
   */
  read(): void;

  /**
   * List available GPS devices for this transport
   * @returns Array of available devices
   */
  listAvailableDevices(): Promise<BluetoothDevice[]>;
}
