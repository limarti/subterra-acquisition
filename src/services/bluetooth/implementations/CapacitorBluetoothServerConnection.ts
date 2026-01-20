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
  private isRestarting = false;
  private messageCompleteTimer: ReturnType<typeof setTimeout> | null = null;

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
      if (this.messageCompleteTimer)
      {
        clearTimeout(this.messageCompleteTimer);
        this.messageCompleteTimer = null;
      }
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

      // Reset timer on each chunk - restart server 500ms after last chunk
      this.scheduleMessageComplete();
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
   * Schedule server restart 500ms after last data chunk
   * Treats all data within 500ms as a single message
   */
  private scheduleMessageComplete(): void
  {
    // Cancel existing timer - new data arrived
    if (this.messageCompleteTimer)
    {
      clearTimeout(this.messageCompleteTimer);
    }

    this.messageCompleteTimer = setTimeout(() =>
    {
      this.messageCompleteTimer = null;
      log('✅ Message complete (500ms since last chunk)');
      this.restartServer();
    }, 500);
  }

  /**
   * Restart server to accept next connection
   */
  private restartServer(): void
  {
    if (this.isRestarting)
    {
      log('⏳ Restart already in progress');
      return;
    }

    if (!this.isServerRunning)
    {
      log('⚠️ Server not running, skipping restart');
      return;
    }

    this.isRestarting = true;

    // Run async restart
    (async () =>
    {
      try
      {
        log('🔄 Restarting server...');

        try
        {
          await BluetoothCommunication.stopServer();
        }
        catch (e)
        {
          // Ignore stop errors
        }

        await BluetoothCommunication.startServer();
        log('✅ Server ready');
      }
      catch (error)
      {
        const errorMsg = error instanceof Error ? error.message : String(error);
        logError(`❌ Restart failed: ${errorMsg}`);
      }
      finally
      {
        this.isRestarting = false;
      }
    })();
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
