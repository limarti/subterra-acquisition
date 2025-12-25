import { BluetoothCommunication } from '@yesprasoon/capacitor-bluetooth-communication';
import type { PluginListenerHandle } from '@capacitor/core';
import type { IBluetoothConnection } from '../types/IBluetoothConnection';
import type { IBluetoothOptions } from '../types/IBluetoothOptions';
import type { BluetoothDevice } from '../types/BluetoothDevice';

// ===== LOGGING =====
const LOG_PREFIX = '🟢 BT-SERVER:';
const log = (message: string, ...args: unknown[]) => console.log(`${LOG_PREFIX} ${message}`, ...args);
const logWarn = (message: string, ...args: unknown[]) => console.warn(`${LOG_PREFIX} ${message}`, ...args);
const logError = (message: string, ...args: unknown[]) => console.error(`${LOG_PREFIX} ${message}`, ...args);

/**
 * Bluetooth Server Connection implementation.
 * Uses @yesprasoon/capacitor-bluetooth-communication plugin.
 *
 * This implementation can:
 * 1. Start a server and listen for incoming connections (server mode)
 * 2. Connect to a device as a client (client mode)
 *
 * Server mode is useful when the external device (like RD8100) initiates
 * the connection to the phone rather than accepting incoming connections.
 */
export class CapacitorBluetoothServerConnection implements IBluetoothConnection
{
  private options: IBluetoothOptions = {};
  private isServerRunning = false;
  private isConnectedAsClient = false;
  private dataListener: PluginListenerHandle | null = null;
  private connectionListener: PluginListenerHandle | null = null;
  private initialized = false;
  private dataReceivedCount = 0;
  private restartTimer: ReturnType<typeof setTimeout> | null = null;
  private isRestarting = false;

  provideOptions(options: IBluetoothOptions): void
  {
    this.options = options;
  }

  /**
   * Initialize the Bluetooth adapter
   */
  private async ensureInitialized(): Promise<void>
  {
    if (this.initialized) return;

    try
    {
      log('Initializing Bluetooth adapter...');
      await BluetoothCommunication.initialize();
      log('Bluetooth adapter initialized');

      log('Enabling Bluetooth...');
      await BluetoothCommunication.enableBluetooth();
      log('Bluetooth enabled');

      this.initialized = true;
    }
    catch (error)
    {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logError(`Initialization failed: ${errorMessage}`);
      throw error;
    }
  }

  /**
   * Start server mode - listen for incoming connections
   */
  async startServer(): Promise<void>
  {
    log('Starting Bluetooth server (listen mode)...');

    try
    {
      await this.ensureInitialized();

      // Set up data listener before starting server
      await this.setupDataListener();

      await BluetoothCommunication.startServer();
      this.isServerRunning = true;

      log('Server started - waiting for incoming connections');
      log('The RD8100 should now be able to connect to this device');

      this.options.onConnect?.();
    }
    catch (error)
    {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logError(`Failed to start server: ${errorMessage}`);
      this.options.onError?.(error instanceof Error ? error : new Error(errorMessage));
      throw error;
    }
  }

  /**
   * Stop server mode
   */
  async stopServer(): Promise<void>
  {
    if (!this.isServerRunning)
    {
      log('Server not running');
      return;
    }

    log('Stopping Bluetooth server...');

    try
    {
      await BluetoothCommunication.stopServer();
      this.isServerRunning = false;
      await this.removeDataListener();
      log('Server stopped');
      this.options.onDisconnect?.();
    }
    catch (error)
    {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logError(`Failed to stop server: ${errorMessage}`);
    }
  }

  /**
   * Connect to a device as a client
   */
  async connect(deviceId: string): Promise<void>
  {
    log(`Connecting to device as client: ${deviceId}`);

    try
    {
      await this.ensureInitialized();

      // Set up data listener before connecting
      await this.setupDataListener();

      await BluetoothCommunication.connect({ address: deviceId });
      this.isConnectedAsClient = true;

      log('Connected as client');
      this.options.onConnect?.();
    }
    catch (error)
    {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logError(`Client connection failed: ${errorMessage}`);
      this.options.onError?.(error instanceof Error ? error : new Error(errorMessage));
      throw error;
    }
  }

  async disconnect(): Promise<void>
  {
    log('Disconnecting...');

    try
    {
      if (this.isServerRunning)
      {
        await this.stopServer();
      }

      if (this.isConnectedAsClient)
      {
        await BluetoothCommunication.disconnect();
        this.isConnectedAsClient = false;
      }

      await this.removeDataListener();
      log('Disconnected');
      this.options.onDisconnect?.();
    }
    catch (error)
    {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logError(`Disconnect failed: ${errorMessage}`);
    }
  }

  async send(data: Uint8Array): Promise<void>
  {
    if (!this.isServerRunning && !this.isConnectedAsClient)
    {
      throw new Error('Not connected');
    }

    const textDecoder = new TextDecoder();
    const stringData = textDecoder.decode(data);

    log(`Sending data: ${stringData.substring(0, 50)}...`);

    try
    {
      await BluetoothCommunication.sendData({ data: stringData });
      log('Data sent');
    }
    catch (error)
    {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logError(`Send failed: ${errorMessage}`);
      throw error;
    }
  }

  async read(): Promise<void>
  {
    // Data is received via the listener, nothing to do here
    log('Read called - data will be received via listener');
  }

  stopReading(): void
  {
    log('Stop reading called');
    // Listener handles this
  }

  async listAvailableDevices(): Promise<BluetoothDevice[]>
  {
    log('Listing available devices...');

    try
    {
      await this.ensureInitialized();

      const result = await BluetoothCommunication.scanDevices();
      const devices = result.devices || [];

      log(`Found ${devices.length} paired devices:`);
      devices.forEach(d => log(`  - ${d.name || 'Unknown'} (${d.address})`));

      return devices.map(d => ({
        id: d.address,
        name: d.name || undefined,
        address: d.address
      }));
    }
    catch (error)
    {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logError(`Failed to list devices: ${errorMessage}`);
      throw error;
    }
  }

  private async setupDataListener(): Promise<void>
  {
    if (this.dataListener)
    {
      log('Data listener already set up');
      return;
    }

    log('Setting up data listener...');

    // Note: addListener may return a Promise, so we await it
    const listenerResult = BluetoothCommunication.addListener('dataReceived', (event) =>
    {
      this.dataReceivedCount++;
      log(`📥 [#${this.dataReceivedCount}] Received data: ${event.data.substring(0, 100)}${event.data.length > 100 ? '...' : ''}`);

      // Convert string to Uint8Array for compatibility
      const encoder = new TextEncoder();
      const uint8Data = encoder.encode(event.data);

      this.options.onData?.(uint8Data);

      // After receiving data, try to ensure server is still ready for next connection
      // Some BT server implementations close after one transfer
      this.ensureServerReady();
    });

    // Handle both sync and async addListener implementations
    if (listenerResult instanceof Promise)
    {
      this.dataListener = await listenerResult;
      log('Data listener ready (async)');
    }
    else
    {
      this.dataListener = listenerResult;
      log('Data listener ready (sync)');
    }

    // Also try to listen for connection state changes if the plugin supports it
    try
    {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const connResult = (BluetoothCommunication as any).addListener('connectionStateChanged', (event: unknown) =>
      {
        log(`🔌 Connection state changed: ${JSON.stringify(event)}`);
      });

      if (connResult instanceof Promise)
      {
        this.connectionListener = await connResult;
        log('Connection state listener ready');
      }
      else
      {
        this.connectionListener = connResult;
        log('Connection state listener ready');
      }
    }
    catch (e)
    {
      // Plugin might not support this event
      log('Connection state listener not available');
    }
  }

  /**
   * Ensure server is ready for next connection
   * Called after data is received in case the plugin closes the connection
   *
   * DEBOUNCED: Multiple rapid calls will only trigger one restart after 1 second of no new data
   */
  private ensureServerReady(): void
  {
    // Cancel any pending restart - we'll schedule a new one
    if (this.restartTimer)
    {
      clearTimeout(this.restartTimer);
      this.restartTimer = null;
    }

    // If already restarting, don't schedule another
    if (this.isRestarting)
    {
      log('⏳ Restart already in progress, skipping');
      return;
    }

    // Wait 1 second after last data chunk before restarting
    // This allows all data chunks to arrive first
    log('⏳ Scheduling server restart in 1s (debounced)...');

    this.restartTimer = setTimeout(async () =>
    {
      this.restartTimer = null;

      // Double-check we're not already restarting
      if (this.isRestarting)
      {
        log('⏳ Restart already in progress, skipping');
        return;
      }

      this.isRestarting = true;

      try
      {
        // Check if we need to restart the server
        if (this.isServerRunning)
        {
          log('🔄 Restarting server to accept new connections...');

          // Try to stop server first
          try
          {
            log('  → Stopping current server...');
            await BluetoothCommunication.stopServer();
            log('  → Server stopped');
          }
          catch (e)
          {
            const stopErr = e instanceof Error ? e.message : String(e);
            log(`  → Stop error (ignored): ${stopErr}`);
          }

          // Start server again
          log('  → Starting server...');
          await BluetoothCommunication.startServer();
          log('✅ Server restarted and ready for next connection');
        }
        else
        {
          log('⚠️ Server not marked as running, skipping restart');
        }
      }
      catch (error)
      {
        const errorMsg = error instanceof Error ? error.message : String(error);
        logError(`❌ Failed to restart server: ${errorMsg}`);

        // Try one more time after another delay
        setTimeout(async () =>
        {
          try
          {
            log('🔄 Retry: Starting server...');
            await BluetoothCommunication.startServer();
            log('✅ Retry: Server started successfully');
          }
          catch (retryError)
          {
            const retryMsg = retryError instanceof Error ? retryError.message : String(retryError);
            logError(`❌ Retry failed: ${retryMsg}`);
          }
        }, 1000);
      }
      finally
      {
        this.isRestarting = false;
      }
    }, 1000);
  }

  private async removeDataListener(): Promise<void>
  {
    if (this.dataListener)
    {
      await this.dataListener.remove();
      this.dataListener = null;
      log('Data listener removed');
    }

    if (this.connectionListener)
    {
      await this.connectionListener.remove();
      this.connectionListener = null;
      log('Connection listener removed');
    }
  }

  /**
   * Check if server is running
   */
  isServerActive(): boolean
  {
    return this.isServerRunning;
  }
}
