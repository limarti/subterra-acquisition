import { App } from '@capacitor/app';
import { KeepAwake } from '@capacitor-community/keep-awake';

/**
 * Global wake lock management for the entire application
 * - Activates wake lock when app is in foreground/active
 * - Releases wake lock when app goes to background/paused
 * - Only works on Android
 */
export const useAppWakeLock = () =>
{
  const handleAppStateChange = async (state: { isActive: boolean }) =>
  {
    try
    {
      if (state.isActive)
      {
        // App is in foreground - activate wake lock
        await KeepAwake.keepAwake();
      }
      else
      {
        // App is in background - release wake lock
        await KeepAwake.allowSleep();
      }
    }
    catch (error)
    {
      console.error('Failed to manage wake lock:', error);
    }
  };

  App.addListener('appStateChange', handleAppStateChange);
  KeepAwake.keepAwake().catch(() => {}); // Initial activation
};
