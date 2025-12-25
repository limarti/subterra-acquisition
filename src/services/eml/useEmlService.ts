import { ref, computed, watch } from 'vue';
import { useUserSettingsStore } from '@/common/stores/useUserSettingsStore';
import type { BluetoothDevice } from '@/services/bluetooth/types/BluetoothDevice';
import type { IBluetoothConnection } from '@/services/bluetooth/types/IBluetoothConnection';
import { EmlConnectionState } from './types/EmlConnectionState.enum';
import { EmlConnectionType } from './types/EmlConnectionType.enum';
import { BluetoothEmlTransport } from './transports/BluetoothEmlTransport';
import type { IEmlTransport } from './types/IEmlTransport';

/**
 * EML Service Composable - Lifecycle Manager
 *
 * Singleton composable that manages EML connection lifecycle:
 * - Auto-connects when device is selected in settings
 * - Auto-reconnects on disconnect/error with exponential backoff
 * - Maintains persistent connection across app lifecycle
 * - Transport-agnostic: works with any IEmlTransport implementation
 */

// ===== LOGGING =====
const LOG_PREFIX = '📡 EML:';
const log = (message: string, ...args: unknown[]) => console.log(`${LOG_PREFIX} ${message}`, ...args);
const logWarn = (message: string, ...args: unknown[]) => console.warn(`${LOG_PREFIX} ${message}`, ...args);
const logError = (message: string, ...args: unknown[]) => console.error(`${LOG_PREFIX} ${message}`, ...args);

// ===== MODULE-LEVEL STATE =====
let reconnectionTimer: number | null = null;
let reconnectionAttempt = 0;
let transport: IEmlTransport | null = null;
let bluetoothClientService: IBluetoothConnection | null = null;
let bluetoothServerService: IBluetoothConnection | null = null;
let isChangingDevice = false;
let isReconnecting = false; // New flag to prevent duplicate reconnection scheduling
let receivingBuffer = '';

const connectionState = ref<EmlConnectionState>(EmlConnectionState.DISCONNECTED);
const connectedDevice = ref<BluetoothDevice | null>(null);
const emlDataCallbacks = ref<Map<string, (data: string) => void>>(new Map());

// ===== CONSTANTS =====
const RECONNECTION_DELAYS = [1000, 2000, 4000, 8000, 10000];
const MAX_RECONNECTION_DELAY = 10000;

// ===== TRANSPORT FACTORY =====
const createTransport = (): IEmlTransport =>
{
  return new BluetoothEmlTransport(bluetoothClientService, bluetoothServerService);
};

// ===== EML DATA HANDLING =====
const distributeEmlData = (data: string) =>
{
  emlDataCallbacks.value.forEach(callback => callback(data));
};

const handleDataReceived = async (data: Uint8Array) =>
{
  const decoder = new TextDecoder();
  const decodedString = decoder.decode(data);

  if (decodedString)
  {
    receivingBuffer += decodedString;
  }

  // For custom text protocol, distribute complete lines
  const lines = receivingBuffer.split('\n');

  // Keep the last incomplete line in the buffer
  receivingBuffer = lines.pop() || '';

  for (const line of lines)
  {
    const trimmedLine = line.trim();
    if (trimmedLine)
    {
      distributeEmlData(trimmedLine);
    }
  }
};

// ===== TRANSPORT EVENT HANDLERS =====
const handleConnect = () =>
{
  log('Connected/Server ready');
  isReconnecting = false;
  connectionState.value = EmlConnectionState.CONNECTED;
  transport?.read();
};

const handleDisconnect = () =>
{
  // In server mode, the RD8100 connects momentarily to send data then disconnects
  // This is normal behavior - don't change state or trigger reconnection
  // The server stays running and ready for the next connection
  log('Device disconnected (server still running)');

  // Only change state if we're actually shutting down (not in server mode)
  // For now, keep the connected state since the server is still listening
};

const handleError = (error: Error) =>
{
  logError('Transport error:', error.message);
  // Don't change state here - let the connection attempt handle it
  // This prevents duplicate state changes and watcher triggers
};

// ===== CONNECTION MANAGEMENT =====
const connectToDevice = async (device: BluetoothDevice) =>
{
  log(`Connecting to device: ${device.name || 'Unknown'} (${device.id})`);

  try
  {
    if (!transport)
    {
      log('Creating new transport');
      transport = createTransport();
    }

    connectionState.value = EmlConnectionState.CONNECTING;
    await transport.connect(device);
    connectedDevice.value = device;
    reconnectionAttempt = 0;
    log('Connection established');
  }
  catch (error)
  {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logError(`Connection failed to ${device.name || device.id}: ${errorMessage}`);
    connectionState.value = EmlConnectionState.DISCONNECTED;
    throw error;
  }
};

const disconnect = async () =>
{
  log('Disconnecting...');
  try
  {
    await transport?.disconnect();
    receivingBuffer = '';
    log('Disconnected successfully');
  }
  catch (error)
  {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logError(`Disconnect failed: ${errorMessage}`);
    throw error;
  }
  finally
  {
    connectionState.value = EmlConnectionState.DISCONNECTED;
    connectedDevice.value = null;
  }
};

// ===== RECONNECTION LOGIC =====
const getReconnectionDelay = (attempt: number): number =>
{
  if (attempt >= RECONNECTION_DELAYS.length || RECONNECTION_DELAYS[attempt] === undefined)
  {
    return MAX_RECONNECTION_DELAY;
  }
  return RECONNECTION_DELAYS[attempt];
};

const cancelReconnection = () =>
{
  if (reconnectionTimer !== null || isReconnecting)
  {
    log('Cancelling reconnection (timer:', reconnectionTimer !== null, ', isReconnecting:', isReconnecting, ')');
    clearTimeout(reconnectionTimer!);
    reconnectionTimer = null;
    reconnectionAttempt = 0;
    isReconnecting = false;
  }
};

const scheduleReconnection = (device: BluetoothDevice) =>
{
  if (!device)
  {
    logWarn('Cannot schedule reconnection: no device');
    return;
  }

  // Prevent duplicate scheduling
  if (isReconnecting)
  {
    log('Reconnection already in progress, skipping duplicate schedule');
    return;
  }

  isReconnecting = true;
  const delay = getReconnectionDelay(reconnectionAttempt);

  log(`Scheduling reconnection attempt ${reconnectionAttempt + 1} in ${delay}ms to ${device.name || device.id}`);

  reconnectionTimer = window.setTimeout(async () =>
  {
    reconnectionTimer = null;
    reconnectionAttempt++;

    log(`Reconnection attempt ${reconnectionAttempt} starting...`);

    try
    {
      await connectToDevice(device);
      // Success - isReconnecting will be reset in handleConnect
    }
    catch (error)
    {
      // Reset flag to allow next schedule, but keep reconnectionAttempt for backoff
      isReconnecting = false;
      scheduleReconnection(device);
    }
  }, delay);
};

// ===== PUBLIC API =====
export const useEmlService = () =>
{
  const userSettingsStore = useUserSettingsStore();

  /**
   * Initialize EML service
   *
   * Sets up Bluetooth services, watchers, and auto-connect logic.
   * Called automatically by EML plugin at app startup.
   *
   * @param clientService - Bluetooth client service for SPP connections (may be null)
   * @param serverService - Bluetooth server service for listening mode (may be null)
   */
  const initialize = (
    clientService: IBluetoothConnection | null,
    serverService: IBluetoothConnection | null = null
  ) =>
  {
    log('Initializing service...');
    log(`Client service: ${clientService ? 'available' : 'not available'}`);
    log(`Server service: ${serverService ? 'available' : 'not available'}`);

    // Store Bluetooth services
    bluetoothClientService = clientService;
    bluetoothServerService = serverService;

    // Register event handlers with client service
    if (bluetoothClientService)
    {
      bluetoothClientService.provideOptions?.({
        onConnect: handleConnect,
        onDisconnect: handleDisconnect,
        onError: handleError,
        onData: handleDataReceived
      });
    }

    // Register event handlers with server service
    if (bluetoothServerService)
    {
      bluetoothServerService.provideOptions?.({
        onConnect: handleConnect,
        onDisconnect: handleDisconnect,
        onError: handleError,
        onData: handleDataReceived
      });
    }

    watch(
      () => userSettingsStore.emlConnectionType,
      async (newType) =>
      {
        log('Connection type changed to:', newType);
        isChangingDevice = true;
        cancelReconnection();

        if (newType === EmlConnectionType.DISABLED)
        {
          log('EML disabled, disconnecting if connected');
          if (connectedDevice.value)
          {
            try
            {
              await disconnect();
            }
            catch (error)
            {
              logError('Failed to disconnect when disabling EML:', error);
            }
          }
        }
        else
        {
          const device = userSettingsStore.selectedBluetoothEmlDevice;

          if (device)
          {
            log('EML enabled, connecting to saved device:', device.name || device.id);
            try
            {
              await connectToDevice(device);
            }
            catch (error)
            {
              scheduleReconnection(device);
            }
          }
          else
          {
            log('EML enabled but no device selected');
          }
        }

        isChangingDevice = false;
      },
      { immediate: true }
    );

    // Watch for device selection changes and auto-connect/disconnect
    watch(
      () => userSettingsStore.selectedBluetoothEmlDevice,
      async (newDevice, oldDevice) =>
      {
        log('Device selection changed:', oldDevice?.name || oldDevice?.id || 'none', '→', newDevice?.name || newDevice?.id || 'none');

        // Only handle device changes if EML is not disabled
        if (userSettingsStore.emlConnectionType === EmlConnectionType.DISABLED)
        {
          log('EML is disabled, ignoring device change');
          return;
        }

        isChangingDevice = true;
        cancelReconnection();

        // Immediately show Connecting status when new device is selected
        if (newDevice)
        {
          connectionState.value = EmlConnectionState.CONNECTING;
        }

        // Disconnect from old device first (if connected)
        if (oldDevice !== undefined && connectedDevice.value)
        {
          log('Disconnecting from previous device:', oldDevice?.name || oldDevice?.id);
          try
          {
            await disconnect();
          }
          catch (error)
          {
            logError('Failed to disconnect from previous device:', error);
          }
        }

        // Auto-connect to new device if one is selected
        if (newDevice)
        {
          try
          {
            await connectToDevice(newDevice);
          }
          catch (error)
          {
            scheduleReconnection(newDevice);
          }
        }
        else
        {
          log('No device selected, staying disconnected');
          connectionState.value = EmlConnectionState.DISCONNECTED;
        }

        isChangingDevice = false;
      },
      { immediate: true }
    );

    // Watch for unexpected disconnections and auto-reconnect
    watch(
      () => connectionState.value,
      (newState) =>
      {
        log('Connection state changed to:', newState, '(isChangingDevice:', isChangingDevice, ', isReconnecting:', isReconnecting, ')');

        // Only auto-reconnect if EML is not disabled
        if (userSettingsStore.emlConnectionType === EmlConnectionType.DISABLED) return;

        const device = userSettingsStore.selectedBluetoothEmlDevice;

        // Use isReconnecting flag instead of just checking reconnectionTimer
        // This prevents duplicate reconnection scheduling
        if (newState === EmlConnectionState.DISCONNECTED && device && !isReconnecting && !isChangingDevice)
        {
          log('Unexpected disconnection detected, starting reconnection');
          reconnectionAttempt = 0;
          scheduleReconnection(device);
        }
      }
    );

    log('Service initialized');
  };

  /**
   * Subscribe to EML data stream
   * @param handler - Callback to receive EML data lines
   * @param onError - Optional error handler
   * @returns Unsubscribe function
   */
  const subscribeToData = (
    handler: (data: string) => void,
    onError?: (error: Error) => void
  ): (() => void) =>
  {
    const callbackId = `${Date.now()}-${Math.random()}`;

    const dataListener = (data: string) =>
    {
      try
      {
        handler(data);
      }
      catch (error)
      {
        if (onError)
        {
          onError(error as Error);
        }
      }
    };

    emlDataCallbacks.value.set(callbackId, dataListener);

    return () =>
    {
      emlDataCallbacks.value.delete(callbackId);
    };
  };

  /**
   * List available EML devices
   * @returns Array of available EML devices
   */
  const listAvailableDevices = async (): Promise<BluetoothDevice[]> =>
  {
    if (!transport)
    {
      transport = createTransport();
    }

    return transport.listAvailableDevices();
  };

  return {
    initialize,
    subscribeToData,
    listAvailableDevices,
    connectionState: computed(() => connectionState.value),
    connectedDevice: computed(() => connectedDevice.value)
  };
};
