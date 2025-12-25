import type { AreaOfInterest } from './AreaOfInterest.type';

export type ProjectMetadata =
  {
    id: string;
    name: string;
    clientName: string;
    jobCode: string;
    dateCreated: number;
    areas: AreaOfInterest[];
  }
