import { ref, computed, watch } from 'vue';
import { useUserSettingsStore } from '@/common/stores/useUserSettingsStore';
import type { NmeaGgaData } from './types/NmeaGgaData.type';
import type { BluetoothDevice } from '@/services/bluetooth/types/BluetoothDevice';
import type { IBluetoothConnection } from '@/services/bluetooth/types/IBluetoothConnection';
import { GpsConnectionState } from './types/GpsConnectionState.enum';
import { GpsConnectionType } from './types/GpsConnectionType.enum';
import { parseNmeaGga, extractNmeaSentences } from './utils/nmeaParser';
import { BluetoothGpsTransport } from './transports/BluetoothGpsTransport';
import type { IGpsTransport } from './types/IGpsTransport';

/**
 * GPS Service Composable - Lifecycle Manager
 *
 * Singleton composable that manages GPS connection lifecycle:
 * - Auto-connects when device is selected in settings
 * - Auto-reconnects on disconnect/error with exponential backoff
 * - Maintains persistent connection across app lifecycle
 * - Transport-agnostic: works with any IGpsTransport implementation
 */

// ===== MODULE-LEVEL STATE =====
let reconnectionTimer: number | null = null;
let reconnectionAttempt = 0;
let transport: IGpsTransport | null = null;
let bluetoothService: IBluetoothConnection | null = null;
let isChangingDevice = false;
let receivingBuffer = '';

const connectionState = ref<GpsConnectionState>(GpsConnectionState.DISCONNECTED);
const connectedDevice = ref<BluetoothDevice | null>(null);
const gpsDataCallbacks = ref<Map<string, (data: NmeaGgaData) => void>>(new Map());

// ===== CONSTANTS =====
const RECONNECTION_DELAYS = [1000, 2000, 4000, 8000, 10000];
const MAX_RECONNECTION_DELAY = 10000;

// ===== TRANSPORT FACTORY =====
const createTransport = (): IGpsTransport =>
{
  return new BluetoothGpsTransport(bluetoothService);
};

// ===== GPS DATA HANDLING =====
const distributeGpsData = (data: NmeaGgaData) =>
{
  gpsDataCallbacks.value.forEach(callback => callback(data));
};

const handleDataReceived = async (data: Uint8Array) =>
{
  const decoder = new TextDecoder();
  const decodedString = decoder.decode(data);

  if (decodedString)
  {
    receivingBuffer += decodedString;
  }

  const { sentences, remainingBuffer } = extractNmeaSentences(receivingBuffer);
  receivingBuffer = remainingBuffer;

  for (const sentence of sentences)
  {
    if (!sentence.includes('GGA'))
    {
      continue;
    }

    try
    {
      const parsedData = parseNmeaGga(sentence);

      if (parsedData.isValid && parsedData.checksumValid)
      {
        distributeGpsData(parsedData);
      }
      else
      {
        console.warn('📍 GPS: Invalid or low-quality fix', {
          checksumValid: parsedData.checksumValid,
          fixQuality: parsedData.fixQuality,
          satellites: parsedData.satellitesUsed
        });
      }
    }
    catch (error)
    {
      console.error('📍 GPS: Failed to parse NMEA sentence', { sentence, error });
    }
  }
};

// ===== TRANSPORT EVENT HANDLERS =====
const handleConnect = () =>
{
  connectionState.value = GpsConnectionState.CONNECTED;
  transport?.read();
};

const handleDisconnect = () =>
{
  if (connectionState.value === GpsConnectionState.CONNECTED)
  {
    connectionState.value = GpsConnectionState.DISCONNECTED;
    connectedDevice.value = null;
  }
};

const handleError = (error: Error) =>
{
  console.error('📍 GPS: Transport error', error);
  connectionState.value = GpsConnectionState.DISCONNECTED;
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

    connectionState.value = GpsConnectionState.CONNECTING;
    await transport.connect(device);
    connectedDevice.value = device;
    reconnectionAttempt = 0;
  }
  catch (error)
  {
    console.error('📍 GPS: Connection failed', error);
    connectionState.value = GpsConnectionState.DISCONNECTED;
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
    console.error('📍 GPS: Disconnect failed', error);
    throw error;
  }
  finally
  {
    connectionState.value = GpsConnectionState.DISCONNECTED;
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
export const useGpsService = () =>
{
  const userSettingsStore = useUserSettingsStore();

  /**
   * Initialize GPS service
   *
   * Sets up Bluetooth service, watchers, and auto-connect logic.
   * Called automatically by GPS plugin at app startup.
   *
   * @param service - Bluetooth service (may be null if unavailable)
   */
  const initialize = (service: IBluetoothConnection | null) =>
  {
    console.log('📍 GPS: Initializing service...');

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
      () => userSettingsStore.gpsConnectionType,
      async (newType) =>
      {
        isChangingDevice = true;
        cancelReconnection();

        if (newType === GpsConnectionType.DISABLED)
        {
          if (connectedDevice.value)
          {
            try
            {
              await disconnect();
            }
            catch (error)
            {
              console.error('📍 GPS: Failed to disconnect when disabling GPS', error);
            }
          }
        }
        else
        {
          const device = userSettingsStore.selectedBluetoothGpsDevice;

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
      () => userSettingsStore.selectedBluetoothGpsDevice,
      async (newDevice, oldDevice) =>
      {
        // Only handle device changes if GPS is not disabled
        if (userSettingsStore.gpsConnectionType === GpsConnectionType.DISABLED) return;

        isChangingDevice = true;
        cancelReconnection();

        // Immediately show Connecting status when new device is selected
        if (newDevice)
        {
          connectionState.value = GpsConnectionState.CONNECTING;
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
            console.error('📍 GPS: Failed to disconnect from previous device', error);
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
          console.log('📍 GPS: No device selected, staying disconnected');
          connectionState.value = GpsConnectionState.DISCONNECTED;
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
        // Only auto-reconnect if GPS is not disabled
        if (userSettingsStore.gpsConnectionType === GpsConnectionType.DISABLED) return;

        const device = userSettingsStore.selectedBluetoothGpsDevice;

        if (newState === GpsConnectionState.DISCONNECTED && device && !reconnectionTimer && !isChangingDevice)
        {
          reconnectionAttempt = 0;
          scheduleReconnection(device);
        }
      }
    );

    console.log('📍 GPS: Service initialized');
  };

  /**
   * Subscribe to GPS location data stream
   * @param handler - Callback to receive parsed NMEA GGA data
   * @param onError - Optional error handler
   * @returns Unsubscribe function
   */
  const subscribeToLocationData = (
    handler: (data: NmeaGgaData) => void,
    onError?: (error: Error) => void
  ): (() => void) =>
  {
    const callbackId = `${Date.now()}-${Math.random()}`;

    const dataListener = (data: NmeaGgaData) =>
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

    gpsDataCallbacks.value.set(callbackId, dataListener);

    return () =>
    {
      gpsDataCallbacks.value.delete(callbackId);
    };
  };

  /**
   * List available GPS devices
   * @returns Array of available GPS devices
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
    subscribeToLocationData,
    listAvailableDevices,
    connectionState: computed(() => connectionState.value),
    connectedDevice: computed(() => connectedDevice.value)
  };
};
