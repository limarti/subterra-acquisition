// ===== LAYER OBJECT TYPES =====
export type LayerObjectType = 'emlReading';

export interface EmlReading
{
  id: string;
  type: 'emlReading';
  epoch: number;      // Unix timestamp
  eml: string;        // Raw EML data
  gps: string;        // Raw NMEA sentence (empty if no fix)
  manualPosition?: { x: number; y: number };
}

export type LayerObject = EmlReading;

// ===== LAYER TYPE =====
export interface Layer
{
  id: string;
  name: string;
  visible: boolean;
  objects: LayerObject[];
}
