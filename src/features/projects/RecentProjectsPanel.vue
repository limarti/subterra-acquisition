<template>
  <div class="flex flex-col gap-2">
    <div v-if="isLoading" class="text-center text-white py-8">
      {{ $t('dashboard.recentProjects.loading') }}
    </div>

    <div v-else-if="error" class="flex flex-col items-center gap-4 text-center text-white py-8">
      <p class="text-text-error">
        {{ $t('dashboard.recentProjects.loadError') }}
      </p>
      <button class="px-4 py-2 bg-accent-info rounded-md"
              @click="loadProjects">
        {{ $t('common.retry') }}
      </button>
    </div>

    <div v-else-if="projects.length === 0" class="text-center text-white py-8">
      {{ $t('dashboard.recentProjects.empty') }}
    </div>

    <template v-else>
      <button v-for="project in projects"
              :key="project.id"
              class="flex items-center justify-between w-full px-3 py-2 rounded-md border border-border-gray hover:border-primary transition-colors cursor-pointer"
              @click="navigateToProject(project.id)">
        <div class="flex flex-col items-start text-left">
          <span class="text-white font-medium">{{ project.name }}</span>
          <span class="text-xs text-text-secondary">{{ formatDate(project.dateCreated) }}</span>
        </div>

        <svg class="w-6 h-6 text-text-secondary" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M9 18L15 12L9 6" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round" />
        </svg>
      </button>
    </template>
  </div>
</template>

<script setup lang="ts">
  import { ref, onMounted } from 'vue';
  import { useI18n } from 'vue-i18n';
  import { useRouter } from 'vue-router';
  import { useProjectsStorage } from '@/features/projects/useProjectsStorage';
  import type { ProjectMetadata } from '@/features/projects/ProjectMetadata.type';

  const { t } = useI18n();
  const router = useRouter();
  const { getProjects } = useProjectsStorage();
  const projects = ref<ProjectMetadata[]>([]);
  const isLoading = ref(false);
  const error = ref(false);

  const formatDate = (timestamp: number): string =>
  {
    const now = Date.now();
    const diffMs = now - timestamp;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return t('dashboard.recentProjects.justNow');
    if (diffMins < 60) return t('dashboard.recentProjects.minutesAgo', [diffMins]);
    if (diffHours < 24) return t('dashboard.recentProjects.hoursAgo', [diffHours]);
    if (diffDays < 7) return t('dashboard.recentProjects.daysAgo', [diffDays]);

    return new Date(timestamp).toLocaleDateString();
  };

  const navigateToProject = (idProject: string) =>
  {
    router.push({ name: 'project', params: { idProject } });
  };

  const loadProjects = async () =>
  {
    isLoading.value = true;
    error.value = false;

    try
    {
      projects.value = await getProjects();
    }
    catch (err)
    {
      error.value = true;
    }
    finally
    {
      isLoading.value = false;
    }
  };

  onMounted(() =>
  {
    loadProjects();
  });
</script>
