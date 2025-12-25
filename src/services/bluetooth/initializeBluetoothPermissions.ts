import { BleClient } from '@capacitor-community/bluetooth-le';
import { Capacitor } from '@capacitor/core';

let isInitialized = false;
let wasDenied = false;

/**
 * Initializes Bluetooth permissions when needed (lazy initialization).
 * Should be called before scanning for Bluetooth devices or when a configured device exists.
 * This ensures permissions are only requested when the user actually needs Bluetooth functionality.
 */
export async function initializeBluetoothPermissions(): Promise<void>
{
  const platform = Capacitor.getPlatform();

  // Only initialize on mobile platforms
  if (platform === 'android' || platform === 'ios')
  {
    // Skip if already initialized successfully
    if (isInitialized)
    {
      return;
    }

    try
    {
      await BleClient.initialize();
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
