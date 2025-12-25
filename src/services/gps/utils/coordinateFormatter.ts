/**
 * Formats a decimal degree coordinate to DMS (Degrees, Minutes, Seconds) format
 * @param decimal - Decimal degrees value (e.g., 52.123456)
 * @param isLatitude - True for latitude (N/S), false for longitude (E/W)
 * @returns Formatted string (e.g., "52° 7' 24.4\" N")
 */
export function formatCoordinateDMS(decimal: number, isLatitude: boolean): string
{
  const absolute = Math.abs(decimal);
  const degrees = Math.floor(absolute);
  const minutesDecimal = (absolute - degrees) * 60;
  const minutes = Math.floor(minutesDecimal);
  const seconds = (minutesDecimal - minutes) * 60;

  const direction = isLatitude
    ? (decimal >= 0 ? 'N' : 'S')
    : (decimal >= 0 ? 'E' : 'W');

  return `${degrees}° ${minutes}' ${seconds.toFixed(1)}" ${direction}`;
}
