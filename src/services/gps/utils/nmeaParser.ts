import type { NmeaGgaData } from '../types/NmeaGgaData.type';
import { GpsFixQuality } from '../types/GpsFixQuality.enum';

// NMEA Coordinate Format Constants
const LONGITUDE_DEGREE_DIGITS = 3; // Longitude uses 3 digits for degrees (0-180)
const LATITUDE_DEGREE_DIGITS = 2;  // Latitude uses 2 digits for degrees (0-90)
const MINUTES_PER_DEGREE = 60;     // Standard conversion: 1 degree = 60 minutes

// NMEA Checksum Constants
const CHECKSUM_LENGTH = 2;              // Checksum is 2 hexadecimal characters
const CHECKSUM_WITH_DELIMITER_LENGTH = 3; // Asterisk (*) + 2 hex characters

// NMEA Time Format Constants
const UTC_TIME_MIN_LENGTH = 6;     // Minimum HHMMSS format
const UTC_HOURS_START = 0;
const UTC_HOURS_END = 2;
const UTC_MINUTES_START = 2;
const UTC_MINUTES_END = 4;
const UTC_SECONDS_START = 4;

// NMEA GGA Sentence Constants
const GGA_MIN_FIELD_COUNT = 15;    // Minimum number of comma-separated fields in GGA sentence

/**
 * Parse NMEA coordinate format (DDMM.MMMM or DDDMM.MMMM) to decimal degrees
 *
 * NMEA coordinates use degrees and decimal minutes format:
 * - Latitude: DDMM.MMMM (2 digits for degrees, rest for minutes)
 * - Longitude: DDDMM.MMMM (3 digits for degrees, rest for minutes)
 *
 * @param coordinate - Coordinate string in DDMM.MMMM or DDDMM.MMMM format
 * @param isLongitude - True if parsing longitude (3-digit degrees), false for latitude (2-digit)
 * @returns Decimal degrees value
 */
function parseCoordinate(coordinate: string, isLongitude: boolean): number | null
{
  if (!coordinate) return null;

  const degreeDigits = isLongitude ? LONGITUDE_DEGREE_DIGITS : LATITUDE_DEGREE_DIGITS;
  const degrees = parseFloat(coordinate.substring(0, degreeDigits));
  const minutes = parseFloat(coordinate.substring(degreeDigits));

  if (isNaN(degrees) || isNaN(minutes))
  {
    return null;
  }

  return degrees + (minutes / MINUTES_PER_DEGREE);
}

/**
 * Calculate NMEA checksum for a sentence (excluding $ and *)
 *
 * @param sentence - NMEA sentence without $ prefix and *checksum suffix
 * @returns Checksum as hexadecimal string (2 characters, uppercase)
 */
function calculateChecksum(sentence: string): string
{
  let checksum = 0;

  for (let i = 0; i < sentence.length; i++)
  {
    checksum ^= sentence.charCodeAt(i);
  }

  return checksum.toString(16).toUpperCase().padStart(CHECKSUM_LENGTH, '0');
}

/**
 * Verify NMEA sentence checksum
 *
 * @param sentence - Complete NMEA sentence including $ and *checksum
 * @returns True if checksum is valid
 */
function verifyChecksum(sentence: string): boolean
{
  const checksumIndex = sentence.indexOf('*');

  if (checksumIndex === -1)
  {
    return false;
  }

  const sentenceData = sentence.substring(1, checksumIndex);
  const providedChecksum = sentence.substring(checksumIndex + 1, checksumIndex + CHECKSUM_WITH_DELIMITER_LENGTH);
  const calculatedChecksum = calculateChecksum(sentenceData);

  return providedChecksum.toUpperCase() === calculatedChecksum;
}

/**
 * Parse UTC time string (HHMMSS.ss) to timestamp
 *
 * @param timeString - UTC time in HHMMSS.ss format
 * @returns UTC timestamp in milliseconds since epoch, or null if invalid
 */
function parseUtcTime(timeString: string): number | null
{
  if (!timeString || timeString.length < UTC_TIME_MIN_LENGTH)
  {
    return null;
  }

  const hours = parseInt(timeString.substring(UTC_HOURS_START, UTC_HOURS_END), 10);
  const minutes = parseInt(timeString.substring(UTC_MINUTES_START, UTC_MINUTES_END), 10);
  const seconds = parseFloat(timeString.substring(UTC_SECONDS_START));

  if (isNaN(hours) || isNaN(minutes) || isNaN(seconds))
  {
    return null;
  }

  const now = new Date();
  const utcDate = new Date(Date.UTC(
    now.getUTCFullYear(),
    now.getUTCMonth(),
    now.getUTCDate(),
    hours,
    minutes,
    Math.floor(seconds)
  ));

  return utcDate.getTime();
}

/**
 * Parse a NMEA GGA sentence into structured data
 *
 * Performs strict validation including checksum verification.
 * Invalid sentences will have isValid = false and checksumValid = false.
 *
 * @param sentence - Complete NMEA GGA sentence (e.g., "$GPGGA,123519,4807.038,N,01131.000,E,1,08,0.9,545.4,M,46.9,M,,*47")
 * @returns Parsed NmeaGgaData object
 * @throws Error if sentence is not a GGA sentence or is malformed
 */
export function parseNmeaGga(sentence: string): NmeaGgaData
{
  const trimmedSentence = sentence.trim();

  if (!trimmedSentence.startsWith('$') || !trimmedSentence.includes('GGA'))
  {
    throw new Error(`Invalid GGA sentence: ${sentence}`);
  }

  const checksumValid = verifyChecksum(trimmedSentence);

  const checksumIndex = trimmedSentence.indexOf('*');
  const sentenceWithoutChecksum = checksumIndex !== -1
    ? trimmedSentence.substring(0, checksumIndex)
    : trimmedSentence;

  const fields = sentenceWithoutChecksum.split(',');

  if (fields.length < GGA_MIN_FIELD_COUNT)
  {
    throw new Error(`GGA sentence has insufficient fields: ${sentence}`);
  }

  const messageId = (fields[0] ?? '').substring(1);
  const utcTime = fields[1] ?? '';
  const latitudeStr = fields[2] ?? null;
  const latitudeDir = fields[3] ?? null;
  const longitudeStr = fields[4] ?? null;
  const longitudeDir = fields[5] ?? null;
  const fixQualityStr = fields[6] ?? '0';
  const satellitesStr = fields[7] ?? '0';
  const hdopStr = fields[8] ?? null;
  const altitudeStr = fields[9] ?? null;
  const altitudeUnits = fields[10] ?? 'M';
  const geoidalSepStr = fields[11] ?? null;
  const geoidalUnits = fields[12] ?? 'M';
  const dgpsAgeStr = fields[13] ?? null;
  const dgpsStationId = fields[14] ?? null;

  const timestamp = parseUtcTime(utcTime);
  const fixQuality = parseInt(fixQualityStr, 10) as GpsFixQuality;
  const satellitesUsed = parseInt(satellitesStr, 10);
  const hdop = hdopStr ? parseFloat(hdopStr) : null;
  const altitude = altitudeStr ? parseFloat(altitudeStr) : null;
  const geoidalSeparation = geoidalSepStr ? parseFloat(geoidalSepStr) : null;
  const dgpsAge = dgpsAgeStr ? parseFloat(dgpsAgeStr) : null;

  let latitude: number | null = null;
  let longitude: number | null = null;

  if (latitudeStr && latitudeDir)
  {
    latitude = parseCoordinate(latitudeStr, false);
    if (latitude !== null && latitudeDir === 'S')
    {
      latitude = -latitude;
    }
  }

  if (longitudeStr && longitudeDir)
  {
    longitude = parseCoordinate(longitudeStr, true);
    if (longitude !== null && longitudeDir === 'W')
    {
      longitude = -longitude;
    }
  }

  const isValid = checksumValid &&
                  fixQuality > GpsFixQuality.INVALID &&
                  latitude !== null &&
                  longitude !== null;

  return {
    messageId,
    utcTime,
    timestamp,
    latitude,
    longitude,
    latitudeDirection: latitudeDir,
    longitudeDirection: longitudeDir,
    fixQuality,
    satellitesUsed,
    hdop,
    altitude,
    altitudeUnits,
    geoidalSeparation,
    geoidalUnits,
    dgpsAge,
    dgpsStationId,
    isValid,
    checksumValid,
    rawSentence: trimmedSentence
  };
}

/**
 * Extract complete NMEA sentences from a data stream buffer
 *
 * NMEA sentences start with '$' and end with '\r\n'.
 * This function extracts all complete sentences and returns remaining incomplete data.
 *
 * @param buffer - Data buffer containing NMEA sentences
 * @returns Object with array of complete sentences and remaining buffer
 */
export function extractNmeaSentences(buffer: string): { sentences: string[]; remainingBuffer: string }
{
  const sentences: string[] = [];
  let remainingBuffer = buffer;

  while (remainingBuffer.includes('\n'))
  {
    const lineEndIndex = remainingBuffer.indexOf('\n');
    const line = remainingBuffer.substring(0, lineEndIndex).trim();
    remainingBuffer = remainingBuffer.substring(lineEndIndex + 1);

    if (line.startsWith('$') && line.includes('*'))
    {
      sentences.push(line);
    }
  }

  return { sentences, remainingBuffer };
}
