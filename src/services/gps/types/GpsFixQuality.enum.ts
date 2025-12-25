/**
 * GPS Fix Quality Indicator
 * Indicates the quality and type of GPS position fix
 */
export enum GpsFixQuality
{
  INVALID = 0,           // Fix not available or invalid
  GPS_FIX = 1,          // GPS Standard Positioning Service (SPS) fix
  DGPS_FIX = 2,         // Differential GPS fix
  PPS_FIX = 3,          // GPS Precise Positioning Service (PPS) fix
  RTK_FIX = 4,          // Real Time Kinematic (RTK) fix
  RTK_FLOAT = 5,        // RTK Float solution
  ESTIMATED = 6,         // Estimated (dead reckoning)
  MANUAL = 7,           // Manual input mode
  SIMULATION = 8         // Simulation mode
}
