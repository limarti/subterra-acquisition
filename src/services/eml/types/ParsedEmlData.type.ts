/**
 * Parsed EML data extracted from the raw EML string
 *
 * Based on Radiodetection locator output format:
 * F03,0073,ACTIVE,200000Hz,140,---,L,P,cm,0,mA,0,dB,-60,...
 */
export interface ParsedEmlData
{
  mode: string;           // Operating mode (e.g., "ACTIVE")
  frequency: number;      // Frequency in Hz
  frequencyDisplay: string; // Formatted frequency (e.g., "200 kHz")
  depth: number;          // Depth value
  depthUnit: string;      // Depth unit (e.g., "cm")
  current: number;        // Current value
  currentUnit: string;    // Current unit (e.g., "mA")
  signal: number;         // Signal strength value
  signalUnit: string;     // Signal unit (e.g., "dB")
  isValid: boolean;       // Whether parsing was successful
}
