import type { AreaOfInterest } from './AreaOfInterest.type';
import type { ProjectObject } from './objects/ProjectObject.type';

export type ProjectMetadata =
  {
    id: string;
    name: string;
    dateCreated: number;
    areas: AreaOfInterest[];
    objects?: ProjectObject[];
  }
