import { ref, provide, inject, type Ref } from 'vue';
import type { ProjectMetadata } from './ProjectMetadata.type';

const PROJECT_CONTEXT_KEY = Symbol('projectContext');

export interface ProjectContext
{
  project: Ref<ProjectMetadata | null>;
  isLoading: Ref<boolean>;
  error: Ref<string | null>;
  saveProject: (project: ProjectMetadata) => Promise<void>;
  reloadProject: () => Promise<void>;
}

export function provideProjectContext(context: ProjectContext): void
{
  provide(PROJECT_CONTEXT_KEY, context);
}

export function useProjectContext(): ProjectContext
{
  const context = inject<ProjectContext>(PROJECT_CONTEXT_KEY);

  if (!context)
  {
    throw new Error('useProjectContext must be used within a ProjectLayout');
  }

  return context;
}
