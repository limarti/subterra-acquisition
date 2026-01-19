import type { ParsedEmlData } from '../types/ParsedEmlData.type';

/**
 * EML String Field Indices
 *
 * Based on analysis of Radiodetection locator output:
 * F03,0073,ACTIVE,200000Hz,140,---,L,P,cm,0,mA,0,dB,-60,...
 */
const EML_FIELD = {
  MODE: 2,
  FREQUENCY: 3,
  DEPTH_UNIT: 8,
  DEPTH_VALUE: 9,
  CURRENT_UNIT: 10,
  CURRENT_VALUE: 11,
  SIGNAL_UNIT: 12,
  SIGNAL_VALUE: 13,
} as const;

const MIN_FIELD_COUNT = 14;

/**
 * Parse frequency string (e.g., "200000Hz") to numeric value
 */
function parseFrequency(freqString: string): number
{
  const match = freqString.match(/^(\d+)/);
  return match ? parseInt(match[1], 10) : 0;
}

/**
 * Format frequency for display (e.g., 200000 -> "200 kHz")
 */
function formatFrequency(hz: number): string
{
  if (hz >= 1000000)
  {
    return `${(hz / 1000000).toFixed(hz % 1000000 === 0 ? 0 : 1)} MHz`;
  }
  if (hz >= 1000)
  {
    return `${(hz / 1000).toFixed(hz % 1000 === 0 ? 0 : 1)} kHz`;
  }
  return `${hz} Hz`;
}

/**
 * Parse raw EML string into structured data
 *
 * @param emlString - Raw EML data string from Radiodetection locator
 * @returns Parsed EML data object
 */
export function parseEmlString(emlString: string): ParsedEmlData
{
  const invalidResult: ParsedEmlData = {
    mode: '',
    frequency: 0,
    frequencyDisplay: '-',
    depth: 0,
    depthUnit: '',
    current: 0,
    currentUnit: '',
    signal: 0,
    signalUnit: '',
    isValid: false,
  };

  if (!emlString)
  {
    return invalidResult;
  }

  const fields = emlString.split(',');

  if (fields.length < MIN_FIELD_COUNT)
  {
    return invalidResult;
  }

  const mode = fields[EML_FIELD.MODE] ?? '';
  const frequencyRaw = fields[EML_FIELD.FREQUENCY] ?? '';
  const frequency = parseFrequency(frequencyRaw);
  const depthUnit = fields[EML_FIELD.DEPTH_UNIT] ?? '';
  const depth = parseFloat(fields[EML_FIELD.DEPTH_VALUE] ?? '0') || 0;
  const currentUnit = fields[EML_FIELD.CURRENT_UNIT] ?? '';
  const current = parseFloat(fields[EML_FIELD.CURRENT_VALUE] ?? '0') || 0;
  const signalUnit = fields[EML_FIELD.SIGNAL_UNIT] ?? '';
  const signal = parseFloat(fields[EML_FIELD.SIGNAL_VALUE] ?? '0') || 0;

  return {
    mode,
    frequency,
    frequencyDisplay: formatFrequency(frequency),
    depth,
    depthUnit,
    current,
    currentUnit,
    signal,
    signalUnit,
    isValid: true,
  };
}
