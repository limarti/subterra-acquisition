// useAppFullscreen.ts
import { onMounted, onUnmounted } from 'vue';
import { App } from '@capacitor/app';
import { Capacitor, type PluginListenerHandle } from '@capacitor/core';
import { StatusBar, Style } from '@capacitor/status-bar';
import { getFeatureFlags } from '@/common/utils/featureFlags';
import { EdgeToEdge } from '@capawesome/capacitor-android-edge-to-edge-support';

/**
 * Configures status bar for mobile platforms:
 * - Shows solid status bar if hideStatusBar flag is enabled
 */
export function useAppFullscreen()
{
  let mounted = true;
  let sub: PluginListenerHandle | undefined;
  let subResume: PluginListenerHandle | undefined;

  const applyFullscreen = async () =>
  {
    if (!mounted || !Capacitor.isNativePlatform()) return;

    try
    {
      const featureFlags = getFeatureFlags();
      const platform = Capacitor.getPlatform();

      // Get CSS variable value for consistent theming
      const backgroundColor = getComputedStyle(document.documentElement)
        .getPropertyValue('--color-background').trim();

      if (featureFlags.hideStatusBar)
      {
        await StatusBar.hide();
      }
      else if (platform === 'android')
      {
        await EdgeToEdge.enable();
        await EdgeToEdge.setBackgroundColor({ color: backgroundColor });
        await StatusBar.setStyle({ style: Style.Dark });
      }
    }
    catch (e)
    {
      console.error('Android status bar configuration failed', e);
    }
  };

  onMounted(async () =>
  {
    applyFullscreen();

    // Re-apply when the app returns to foreground
    sub = await App.addListener('appStateChange', ({ isActive }) =>
    {
      if (isActive) applyFullscreen();
    });

    // Some OEMs are more reliable with 'resume'
    if (App.addListener)
    {
      subResume = await App.addListener('resume', applyFullscreen);
    }
  });

  onUnmounted(() =>
  {
    mounted = false;
    sub?.remove();
    subResume?.remove();
  });
}
