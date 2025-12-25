import type { IEmlTransport } from '../types/IEmlTransport';
import type { BluetoothDevice } from '@/services/bluetooth/types/BluetoothDevice';
import type { IBluetoothConnection } from '@/services/bluetooth/types/IBluetoothConnection';

// ===== LOGGING =====
const LOG_PREFIX = '📡 EML-Transport:';
const log = (message: string, ...args: unknown[]) => console.log(`${LOG_PREFIX} ${message}`, ...args);
const logError = (message: string, ...args: unknown[]) => console.error(`${LOG_PREFIX} ${message}`, ...args);

/**
 * Bluetooth EML Transport
 *
 * Implements EML transport over Bluetooth using SERVER MODE.
 * The RD8100 acts as a Bluetooth client and connects TO the phone,
 * so the phone must run a server and listen for incoming connections.
 *
 * Server mode:
 * - Phone starts a Bluetooth RFCOMM server
 * - RD8100 connects to the phone when sending data
 * - Data is received via the server's data listener
 */
export class BluetoothEmlTransport implements IEmlTransport
{
  private clientService: IBluetoothConnection | null;
  private serverService: IBluetoothConnection | null;
  private connectedDevice: BluetoothDevice | null = null;
  private usingServerMode = false;
  private serverStarted = false;

  constructor(
    clientService: IBluetoothConnection | null,
    serverService: IBluetoothConnection | null = null
  )
  {
    if (!clientService && !serverService)
    {
      throw new Error('At least one Bluetooth service must be provided');
    }

    this.clientService = clientService;
    this.serverService = serverService;
  }

  async connect(device: BluetoothDevice): Promise<void>
  {
    if (!device)
    {
      throw new Error('No valid EML device provided');
    }

    this.connectedDevice = device;

    // Use server mode directly - RD8100 connects TO the phone
    if (this.serverService?.startServer)
    {
      // If server is already running, just update the device reference
      if (this.serverStarted)
      {
        log('Server already running, ready for connections');
        this.usingServerMode = true;
        return;
      }

      try
      {
        log('Starting Bluetooth server (listen mode)...');
        log(`Selected device: ${device.name || device.id}`);
        log('The RD8100 will connect to this phone when sending data');

        // Set flags BEFORE starting server so callbacks see correct state
        this.usingServerMode = true;
        this.serverStarted = true;

        await this.serverService.startServer();
        log('Server started - listening for incoming connections');
        return;
      }
      catch (serverError)
      {
        const errorMsg = serverError instanceof Error ? serverError.message : String(serverError);
        logError(`Server mode failed: ${errorMsg}`);
        // Reset flags on failure
        this.usingServerMode = false;
        this.serverStarted = false;
        this.connectedDevice = null;
        throw serverError;
      }
    }

    // Fallback to client mode if no server service (shouldn't happen for RD8100)
    if (this.clientService)
    {
      try
      {
        log(`Trying client mode connection to ${device.name || device.id}...`);
        await this.clientService.connect(device.id);
        this.usingServerMode = false;
        log('Client mode connection successful');
        return;
      }
      catch (clientError)
      {
        const errorMsg = clientError instanceof Error ? clientError.message : String(clientError);
        logError(`Client mode failed: ${errorMsg}`);
        this.connectedDevice = null;
        throw clientError;
      }
    }

    this.connectedDevice = null;
    throw new Error('No connection method available');
  }

  async disconnect(): Promise<void>
  {
    if (!this.connectedDevice && !this.serverStarted)
    {
      return;
    }

    log('Disconnecting...');

    try
    {
      if (this.usingServerMode && this.serverService?.stopServer)
      {
        await this.serverService.stopServer();
        this.serverStarted = false;
      }
      else if (this.clientService)
      {
        await this.clientService.disconnect();
      }
    }
    catch (error)
    {
      const errorMsg = error instanceof Error ? error.message : String(error);
      logError(`Disconnect error: ${errorMsg}`);
    }

    this.connectedDevice = null;
    this.usingServerMode = false;
    log('Disconnected');
  }

  /**
   * Check if server is currently running
   */
  isServerRunning(): boolean
  {
    return this.serverStarted;
  }

  read(): void
  {
    if (!this.connectedDevice)
    {
      return;
    }

    const service = this.usingServerMode ? this.serverService : this.clientService;
    service?.read();
  }

  async listAvailableDevices(): Promise<BluetoothDevice[]>
  {
    // Use client service for listing devices (it has the SPP implementation)
    if (this.clientService)
    {
      return this.clientService.listAvailableDevices();
    }

    if (this.serverService)
    {
      return this.serverService.listAvailableDevices();
    }

    return [];
  }

  /**
   * Check if currently using server mode
   */
  isUsingServerMode(): boolean
  {
    return this.usingServerMode;
  }
}
