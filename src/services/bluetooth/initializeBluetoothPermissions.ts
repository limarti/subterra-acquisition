import { Capacitor } from '@capacitor/core';

let isInitialized = false;
let wasDenied = false;

/**
 * Initializes Bluetooth permissions when needed (lazy initialization).
 * Should be called before scanning for Bluetooth devices or when a configured device exists.
 * This ensures permissions are only requested when the user actually needs Bluetooth functionality.
 *
 * Note: The cordova-plugin-bluetooth-classic-serial-port handles permissions internally,
 * but we trigger initialization by calling list() to request permissions proactively.
 */
export async function initializeBluetoothPermissions(): Promise<void>
{
  const platform = Capacitor.getPlatform();

  // Only initialize on Android (iOS requires MFi certification for SPP)
  if (platform === 'android')
  {
    // Skip if already initialized successfully
    if (isInitialized)
    {
      return;
    }

    try
    {
      // Trigger permission request by calling list
      await new Promise<void>((resolve, reject) =>
      {
        bluetoothClassicSerial.list(
          () => resolve(),
          (error) => reject(new Error(error))
        );
      });

      isInitialized = true;
      wasDenied = false;
    }
    catch (error)
    {
      isInitialized = false;
      wasDenied = true;
      throw error;
    }
  }
}

/**
 * Check if Bluetooth permissions were previously denied.
 */
export function wasPermissionDenied(): boolean
{
  return wasDenied;
}
