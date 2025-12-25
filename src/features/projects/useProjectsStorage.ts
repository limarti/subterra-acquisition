import type { ProjectMetadata } from './ProjectMetadata.type';
import { useFileManager } from '@/services/files/composables/useFileManager';
import { GeoFolderDoesNotExistError } from '@/services/files/exceptions/GeoFolderDoesNotExistError';

export const useProjectsStorage = () =>
{
  const fileManager = useFileManager();

  const saveProject = async (metadata: ProjectMetadata): Promise<void> =>
  {
    try
    {
      const metadataPath = `projects/${metadata.id}/metadata.json`;
      const metadataJson = JSON.stringify(metadata, null, 2);
      const metadataBytes = new TextEncoder().encode(metadataJson);

      await fileManager.save(metadataBytes, metadataPath);
    }
    catch (err)
    {
      const errorMessage = err instanceof Error ? err.message : 'Failed to save project';
      throw new Error(`Failed to save project: ${errorMessage}`);
    }
  };

  const getProjects = async (limit?: number): Promise<ProjectMetadata[]> =>
  {
    try
    {
      const idsProject = await fileManager.listDirectory('projects');

      const projectPromises = idsProject.map(async (idProject) =>
      {
        const metadataPath = `projects/${idProject}/metadata.json`;
        const metadataBytes = await fileManager.read(metadataPath);

        if (!metadataBytes)
        {
          return null;
        }

        try
        {
          const metadataJson = new TextDecoder().decode(metadataBytes);
          const metadata: ProjectMetadata = JSON.parse(metadataJson);
          return metadata;
        }
        catch
        {
          return null;
        }
      });

      const projects = (await Promise.all(projectPromises)).filter((p): p is ProjectMetadata => p !== null);

      projects.sort((a, b) => b.dateCreated - a.dateCreated);

      return limit !== undefined ? projects.slice(0, limit) : projects;
    }
    catch (err)
    {
      if (err instanceof GeoFolderDoesNotExistError)
      {
        return [];
      }

      const errorMessage = err instanceof Error ? err.message : 'Failed to read projects';
      throw new Error(`Failed to read projects: ${errorMessage}`);
    }
  };

  const getProject = async (idProject: string): Promise<ProjectMetadata | null> =>
  {
    try
    {
      const metadataPath = `projects/${idProject}/metadata.json`;
      const metadataBytes = await fileManager.read(metadataPath);

      if (!metadataBytes)
      {
        return null;
      }

      const metadataJson = new TextDecoder().decode(metadataBytes);
      const metadata: ProjectMetadata = JSON.parse(metadataJson);

      return metadata;
    }
    catch (err)
    {
      const errorMessage = err instanceof Error ? err.message : 'Failed to read project';
      throw new Error(`Failed to read project: ${errorMessage}`);
    }
  };

  const deleteProject = async (idProject: string): Promise<void> =>
  {
    const projectPath = `projects/${idProject}`;

    try
    {
      // Delete project metadata
      await fileManager.delete(`${projectPath}/metadata.json`);
    }
    catch (err)
    {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete project';
      throw new Error(`Failed to delete project: ${errorMessage}`);
    }
  };

  return {
    saveProject,
    getProjects,
    getProject,
    deleteProject
  };
};
