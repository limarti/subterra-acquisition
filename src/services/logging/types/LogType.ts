/**
 * Log entry type categorization for radar communication logging
 */
export enum LogType
{
  /**
   * Commands sent to the radar device
   */
  COMMAND_SENT = 'COMMAND_SENT',

  /**
   * Messages received from radar (excluding scan data)
   */
  MESSAGE_RECEIVED = 'MESSAGE_RECEIVED',

  /**
   * Radar scan data (sampled at configured rate)
   */
  RADAR_SCAN_DATA = 'RADAR_SCAN_DATA',

  /**
   * System events related to logging
   */
  SYSTEM_EVENT = 'SYSTEM_EVENT'
}
