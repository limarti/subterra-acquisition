import type { ProjectMetadata } from './ProjectMetadata.type';
import type { AreaOfInterest } from './AreaOfInterest.type';

export const createDefaultAOI = (name: string = 'AOI 1'): AreaOfInterest =>
{
  return {
    id: crypto.randomUUID(),
    name,
    results: []
  };
};

export const ensureAreasExist = (project: ProjectMetadata): ProjectMetadata =>
{
  if (!project.areas || project.areas.length === 0)
  {
    return {
      ...project,
      areas: [createDefaultAOI()]
    };
  }
  return project;
};

/**
 * Ensures the project has a layers array.
 * Used for backward compatibility with projects created before layers were added.
 */
export const ensureLayersExist = (project: ProjectMetadata): ProjectMetadata =>
{
  if (!project.layers)
  {
    return {
      ...project,
      layers: []
    };
  }
  return project;
};
