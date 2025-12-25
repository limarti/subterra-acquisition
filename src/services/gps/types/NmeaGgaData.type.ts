import type { GpsFixQuality } from './GpsFixQuality.enum';

/**
 * Parsed and validated NMEA GGA (Global Positioning System Fix Data)
 *
 * Contains decoded decimal coordinates and validated numeric values
 * from a NMEA GGA sentence.
 *
 * Example sentence:
 * $GPGGA,123519,4807.038,N,01131.000,E,1,08,0.9,545.4,M,46.9,M,,*47
 */
export interface NmeaGgaData
{
  messageId: string;                    // Talker ID + sentence formatter (e.g., "GPGGA", "GNGGA")

  utcTime: string;                      // Raw UTC time string (HHMMSS.ss)
  timestamp: number | null;             // UTC timestamp in milliseconds since epoch

  latitude: number | null;              // Decimal degrees (-90 to +90, negative = South)
  longitude: number | null;             // Decimal degrees (-180 to +180, negative = West)
  latitudeDirection: string | null;     // 'N' or 'S'
  longitudeDirection: string | null;    // 'E' or 'W'

  fixQuality: GpsFixQuality;            // GPS fix quality indicator
  satellitesUsed: number;               // Number of satellites being tracked (0-12+)
  hdop: number | null;                  // Horizontal Dilution of Precision

  altitude: number | null;              // Altitude above mean sea level (meters)
  altitudeUnits: string;                // Usually "M" for meters
  geoidalSeparation: number | null;     // Difference between WGS-84 and mean sea level (meters)
  geoidalUnits: string;                 // Usually "M" for meters

  dgpsAge: number | null;               // Age of differential data (seconds since last update)
  dgpsStationId: string | null;         // Differential reference station ID

  isValid: boolean;                     // True if position data is valid and fix quality > 0
  checksumValid: boolean;               // True if checksum verification passed

  rawSentence: string;                  // Original NMEA sentence for debugging
}
