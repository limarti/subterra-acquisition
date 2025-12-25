<template>
  <OverlayScrollbarsComponent class="h-full">
    <ProjectMetadataTab v-if="project"
                        :project="project"
                        @save="handleSave" />
  </OverlayScrollbarsComponent>
</template>

<script setup lang="ts">
  import { OverlayScrollbarsComponent } from 'overlayscrollbars-vue';
  import ProjectMetadataTab from './ProjectMetadataTab.vue';
  import { useProjectContext } from './useProjectContext';
  import type { ProjectMetadata } from './ProjectMetadata.type';

  const { project, saveProject } = useProjectContext();

  const handleSave = async (updates: Partial<ProjectMetadata>) =>
  {
    if (!project.value) return;

    const updatedProject = {
      ...project.value,
      name: updates.name ?? project.value.name,
      clientName: updates.clientName ?? project.value.clientName,
      jobCode: updates.jobCode ?? project.value.jobCode
    };

    await saveProject(updatedProject);
  };
</script>
