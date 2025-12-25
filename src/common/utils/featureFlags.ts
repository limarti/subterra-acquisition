/**
 * Feature flags for internal development and testing.
 */

export interface FeatureFlags
{
  /**
   * Controls whether the status bar should be hidden on mobile platforms.
   *
   * - `true`: Status bar is hidden (original behavior)
   * - `false`: Status bar remains visible (default)
   *
   */
  hideStatusBar: boolean;

  /**
   * Controls whether the debug console can be activated.
   *
   * - `true`: Debug console available
   * - `false`: Debug console completely disabled
   *
   */
  enableDebugConsole: boolean;

  /**
   * Controls whether the system logs panel is visible in settings.
   *
   * - `true`: System logs panel is shown
   * - `false`: System logs panel is hidden (default)
   *
   */
  showSystemLogs: boolean;
}

const DEFAULT_FEATURE_FLAGS: FeatureFlags = {
  hideStatusBar: false,
  enableDebugConsole: true,
  showSystemLogs: false
};

export function getFeatureFlags(): FeatureFlags
{
  return { ...DEFAULT_FEATURE_FLAGS };
}
