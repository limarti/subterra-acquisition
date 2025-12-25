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

// ===== MODULE-LEVEL STATE =====
let reconnectionTimer: number | null = null;
let reconnectionAttempt = 0;
let transport: IEmlTransport | null = null;
let bluetoothService: IBluetoothConnection | null = null;
let isChangingDevice = false;
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
  return new BluetoothEmlTransport(bluetoothService);
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
  connectionState.value = EmlConnectionState.CONNECTED;
  transport?.read();
};

const handleDisconnect = () =>
{
  if (connectionState.value === EmlConnectionState.CONNECTED)
  {
    connectionState.value = EmlConnectionState.DISCONNECTED;
    connectedDevice.value = null;
  }
};

const handleError = (error: Error) =>
{
  console.error('📡 EML: Transport error', error);
  connectionState.value = EmlConnectionState.DISCONNECTED;
  connectedDevice.value = null;
};

// ===== CONNECTION MANAGEMENT =====
const connectToDevice = async (device: BluetoothDevice) =>
{
  try
  {
    if (!transport)
    {
      transport = createTransport();
    }

    connectionState.value = EmlConnectionState.CONNECTING;
    await transport.connect(device);
    connectedDevice.value = device;
    reconnectionAttempt = 0;
  }
  catch (error)
  {
    console.error('📡 EML: Connection failed', error);
    connectionState.value = EmlConnectionState.DISCONNECTED;
    throw error;
  }
};

const disconnect = async () =>
{
  try
  {
    await transport?.disconnect();
    receivingBuffer = '';
  }
  catch (error)
  {
    console.error('📡 EML: Disconnect failed', error);
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
  if (reconnectionTimer !== null)
  {
    clearTimeout(reconnectionTimer);
    reconnectionTimer = null;
    reconnectionAttempt = 0;
  }
};

const scheduleReconnection = (device: BluetoothDevice) =>
{
  if (!device) return;

  const delay = getReconnectionDelay(reconnectionAttempt);

  reconnectionTimer = window.setTimeout(async () =>
  {
    reconnectionTimer = null;
    reconnectionAttempt++;

    try
    {
      await connectToDevice(device);
    }
    catch (error)
    {
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
   * Sets up Bluetooth service, watchers, and auto-connect logic.
   * Called automatically by EML plugin at app startup.
   *
   * @param service - Bluetooth service (may be null if unavailable)
   */
  const initialize = (service: IBluetoothConnection | null) =>
  {
    console.log('📡 EML: Initializing service...');

    // Store Bluetooth service
    bluetoothService = service;

    // Register event handlers with Bluetooth service
    if (bluetoothService)
    {
      bluetoothService.provideOptions?.({
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
        isChangingDevice = true;
        cancelReconnection();

        if (newType === EmlConnectionType.DISABLED)
        {
          if (connectedDevice.value)
          {
            try
            {
              await disconnect();
            }
            catch (error)
            {
              console.error('📡 EML: Failed to disconnect when disabling EML', error);
            }
          }
        }
        else
        {
          const device = userSettingsStore.selectedBluetoothEmlDevice;

          if (device)
          {
            try
            {
              await connectToDevice(device);
            }
            catch (error)
            {
              scheduleReconnection(device);
            }
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
        // Only handle device changes if EML is not disabled
        if (userSettingsStore.emlConnectionType === EmlConnectionType.DISABLED) return;

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
          try
          {
            await disconnect();
          }
          catch (error)
          {
            console.error('📡 EML: Failed to disconnect from previous device', error);
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
          console.log('📡 EML: No device selected, staying disconnected');
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
        // Only auto-reconnect if EML is not disabled
        if (userSettingsStore.emlConnectionType === EmlConnectionType.DISABLED) return;

        const device = userSettingsStore.selectedBluetoothEmlDevice;

        if (newState === EmlConnectionState.DISCONNECTED && device && !reconnectionTimer && !isChangingDevice)
        {
          reconnectionAttempt = 0;
          scheduleReconnection(device);
        }
      }
    );

    console.log('📡 EML: Service initialized');
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
