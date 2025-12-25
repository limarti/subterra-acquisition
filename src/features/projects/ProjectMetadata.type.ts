import type { AreaOfInterest } from './AreaOfInterest.type';

export type ProjectMetadata =
  {
    id: string;
    name: string;
    dateCreated: number;
    areas: AreaOfInterest[];
  }
