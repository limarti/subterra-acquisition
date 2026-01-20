import { GpsFixQuality } from '../types/GpsFixQuality.enum';

/**
 * Human-readable labels for GPS fix quality values
 */
export const fixQualityLabels: Record<GpsFixQuality, string> = {
  [GpsFixQuality.INVALID]: 'Invalid',
  [GpsFixQuality.GPS_FIX]: 'GPS',
  [GpsFixQuality.DGPS_FIX]: 'DGPS',
  [GpsFixQuality.PPS_FIX]: 'PPS',
  [GpsFixQuality.RTK_FIX]: 'RTK FIX',
  [GpsFixQuality.RTK_FLOAT]: 'Float',
  [GpsFixQuality.ESTIMATED]: 'Estimated',
  [GpsFixQuality.MANUAL]: 'Manual',
  [GpsFixQuality.SIMULATION]: 'Sim',
};

/**
 * Get human-readable label for a GPS fix quality value
 */
export const getFixQualityLabel = (fixQuality: GpsFixQuality): string =>
{
  return fixQualityLabels[fixQuality] ?? 'Unknown';
};
