import type { Trace } from './Trace';

export type Channel = {
  id: string;
  image: any;
  traces: Trace[];
  linearOffset: number; //Always in meters. Positive means ahead of origin point.
  timeInterval: number; // Time interval between samples in seconds
  samplesPerScan: number;
  depthZeroSample: number;
  scansPerMeter: number;
  timeZeroSample: number;
  scansPerSecond: number;
};
