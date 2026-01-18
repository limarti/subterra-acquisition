<template>
  <div class="h-full flex flex-col relative">
    <div class="relative z-10">
      <NavigationBar :showBackButton="true" @back="navigateBack">
        <template v-if="project" #left>
          <PageTitle :label="$t('project.label')" :content="project.name" />
        </template>

        <template v-if="project" #right>
          <button type="button"
                  class="p-2 cursor-pointer text-gray-200 hover:text-white transition-colors border-l border-border-gray"
                  :title="$t('project.projectActions')"
                  @click="isMenuOpen = !isMenuOpen">
            <svg class="w-5 h-5"
                 viewBox="0 0 24 24"
                 fill="none"
                 stroke="currentColor"
                 stroke-width="2"
                 stroke-linecap="round"
                 stroke-linejoin="round">
              <circle cx="12" cy="5" r="1" />
              <circle cx="12" cy="12" r="1" />
              <circle cx="12" cy="19" r="1" />
            </svg>
          </button>
        </template>
      </NavigationBar>

      <!-- Menu drawer -->
      <Transition name="drawer">
        <div v-if="isMenuOpen" class="absolute top-full left-0 right-0 bg-background border-b border-border-gray shadow-lg overflow-hidden">
          <div class="p-2 space-y-1">
            <!-- Navigation links -->
            <button type="button"
                    class="w-full flex items-center gap-3 px-3 py-2 text-sm text-white hover:bg-background-lighter rounded transition-colors"
                    :class="{ 'bg-background-lighter': isActiveRoute('project-map') }"
                    @click="navigateTo('project-map')">
              <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6" />
                <line x1="8" y1="2" x2="8" y2="18" />
                <line x1="16" y1="6" x2="16" y2="22" />
              </svg>
              {{ $t('project.map') }}
            </button>

            <button type="button"
                    class="w-full flex items-center gap-3 px-3 py-2 text-sm text-white hover:bg-background-lighter rounded transition-colors"
                    :class="{ 'bg-background-lighter': isActiveRoute('project-details') }"
                    @click="navigateTo('project-details')">
              <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="16" y1="13" x2="8" y2="13" />
                <line x1="16" y1="17" x2="8" y2="17" />
                <polyline points="10 9 9 9 8 9" />
              </svg>
              {{ $t('project.details') }}
            </button>

            <button type="button"
                    class="w-full flex items-center gap-3 px-3 py-2 text-sm text-white hover:bg-background-lighter rounded transition-colors"
                    :class="{ 'bg-background-lighter': isActiveRoute('project-logs') }"
                    @click="navigateTo('project-logs')">
              <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="16" y1="13" x2="8" y2="13" />
                <line x1="16" y1="17" x2="8" y2="17" />
                <line x1="10" y1="9" x2="8" y2="9" />
              </svg>
              {{ $t('project.logs.title') }}
            </button>

            <!-- AOI links -->
            <template v-if="project?.areas?.length">
              <div class="border-t border-border-gray my-2" />
              <div class="px-3 py-1 text-xs text-text-secondary uppercase">
                {{ $t('project.aois') }}
              </div>
              <button v-for="area in project.areas"
                      :key="area.id"
                      type="button"
                      class="w-full flex items-center gap-3 px-3 py-2 text-sm text-white hover:bg-background-lighter rounded transition-colors"
                      :class="{ 'bg-background-lighter': isActiveAOI(area.id) }"
                      @click="navigateToAOI(area.id)">
                <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <circle cx="12" cy="10" r="3" />
                  <path d="M12 21.7C17.3 17 20 13 20 10a8 8 0 1 0-16 0c0 3 2.7 7 8 11.7z" />
                </svg>
                {{ area.name }}
              </button>
            </template>

            <!-- Divider -->
            <div class="border-t border-border-gray my-2" />

            <!-- Share project -->
            <button type="button"
                    class="w-full flex items-center gap-3 px-3 py-2 text-sm text-white hover:bg-background-lighter rounded transition-colors"
                    :class="{ 'opacity-50': isSharing }"
                    :disabled="isSharing"
                    @click="isMenuOpen = false; handleProjectShare();">
              <svg v-if="isSharing" class="animate-spin w-4 h-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              <svg v-else class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
                <polyline points="16 6 12 2 8 6" />
                <line x1="12" y1="2" x2="12" y2="15" />
              </svg>
              {{ $t('project.shareProject') }}
            </button>

            <!-- Delete project -->
            <button type="button"
                    class="w-full flex items-center gap-3 px-3 py-2 text-sm text-red-400 hover:bg-background-lighter rounded transition-colors"
                    @click="isMenuOpen = false; handleProjectDelete();">
              <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="3 6 5 6 21 6" />
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
              </svg>
              {{ $t('project.deleteProject') }}
            </button>
          </div>
        </div>
      </Transition>
    </div>

    <!-- Backdrop overlay -->
    <Transition name="fade">
      <div v-if="isMenuOpen"
           class="absolute inset-0 bg-black/50 backdrop-blur-sm z-[5]"
           @click="isMenuOpen = false" />
    </Transition>

    <!-- Main content -->
    <div class="flex-1 min-h-0 overflow-hidden relative z-0">
      <div v-if="isLoading" class="flex items-center justify-center h-full">
        <p class="text-text-secondary">
          {{ $t('project.loading') }}
        </p>
      </div>

      <div v-else-if="error" class="flex items-center justify-center h-full">
        <div class="text-center">
          <p class="text-red-400 mb-4">
            {{ error }}
          </p>
          <button class="px-4 py-2 bg-accent-info text-white rounded-full" @click="loadProject">
            {{ $t('common.retry') }}
          </button>
        </div>
      </div>

      <router-view v-else-if="project" />

      <div v-else class="flex items-center justify-center h-full">
        <p class="text-text-secondary">
          {{ $t('project.notFound') }}
        </p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { ref, onMounted, computed } from 'vue';
  import { useRouter, useRoute } from 'vue-router';
  import { useI18n } from 'vue-i18n';
  import { Capacitor } from '@capacitor/core';
  import { Share } from '@capacitor/share';
  import { Filesystem, Directory } from '@capacitor/filesystem';
  import JSZip from 'jszip';
  import NavigationBar from '@/common/components/NavigationBar.vue';
  import PageTitle from '@/common/components/PageTitle.vue';
  import GeoConfirmationDialog from '@/generic/components/GeoConfirmationDialog.vue';
  import { useProjectsStorage } from './useProjectsStorage';
  import { useFileManager } from '@/services/files/composables/useFileManager';
  import { useDialog } from '@/generic/composables/useDialog';
  import { useToast } from '@/common/composables/useToast';
  import { provideProjectContext } from './useProjectContext';
  import type { ProjectMetadata } from './ProjectMetadata.type';
  import ToastNotification from '@/common/components/ToastNotification.vue';
  import { ToastType } from '@/common/types/ToastType';
  import { useEmlRecorder } from '@/services/eml/useEmlRecorder';
  import { uint8ArrayToBase64 } from '@/services/files/utils/base64';
  import { downloadBlobAsFile } from '@/common/utils/downloadBlobAsFile';

  const router = useRouter();
  const route = useRoute();
  const { t } = useI18n();
  const { open } = useDialog();
  const { getProject, saveProject: saveProjectToStorage, deleteProject } = useProjectsStorage();
  const { show } = useToast();
  const fileManager = useFileManager();

  const project = ref<ProjectMetadata | null>(null);
  const isLoading = ref(false);
  const error = ref<string | null>(null);
  const isDeleting = ref(false);
  const isSharing = ref(false);
  const isMenuOpen = ref(false);

  const idProject = computed(() => route.params.idProject as string);

  const isActiveRoute = (routeName: string): boolean =>
  {
    return route.name === routeName;
  };

  const isActiveAOI = (idAOI: string): boolean =>
  {
    return route.name === 'project-aoi' && route.params.idAOI === idAOI;
  };

  const navigateTo = (routeName: string) =>
  {
    isMenuOpen.value = false;
    router.push({ name: routeName, params: { idProject: idProject.value } });
  };

  const navigateToAOI = (idAOI: string) =>
  {
    isMenuOpen.value = false;
    router.push({ name: 'project-aoi', params: { idProject: idProject.value, idAOI } });
  };

  const loadProject = async () =>
  {
    if (!idProject.value)
    {
      error.value = t('project.error');
      return;
    }

    isLoading.value = true;
    error.value = null;

    try
    {
      const loadedProject = await getProject(idProject.value);

      if (loadedProject)
      {
        project.value = loadedProject;
      }
      else
      {
        error.value = t('project.error');
      }
    }
    catch (err)
    {
      console.error('Failed to load project:', err);
      error.value = err instanceof Error ? err.message : t('project.error');
    }
    finally
    {
      isLoading.value = false;
    }
  };

  const saveProject = async (updatedProject: ProjectMetadata) =>
  {
    await saveProjectToStorage(updatedProject);
    project.value = updatedProject;
  };

  // Initialize EML recorder - auto-starts when project is loaded
  useEmlRecorder(project, saveProject);

  const navigateBack = () =>
  {
    router.push({ name: 'dashboard' });
  };

  const handleProjectDelete = async () =>
  {
    if (!project.value || isDeleting.value) return;

    const projectName = project.value.name;

    const confirmed = await open(GeoConfirmationDialog, {
      title: t('project.confirmDeleteTitle'),
      message: t('project.confirmDeleteSingle', { name: projectName }),
      confirmText: t('common.delete'),
      cancelText: t('common.cancel')
    });

    if (!confirmed) return;

    isDeleting.value = true;

    try
    {
      await deleteProject(idProject.value);

      router.push({ name: 'dashboard' });

      show(ToastNotification, {
        message: t('project.deleteSuccess'),
        type: ToastType.SUCCESS
      });
    }
    catch (err)
    {
      console.error('Failed to delete project:', err);
      show(ToastNotification, {
        message: t('project.deleteError'),
        type: ToastType.ERROR
      });
    }
    finally
    {
      isDeleting.value = false;
    }
  };

  const handleProjectShare = async () =>
  {
    if (!project.value || isSharing.value) return;

    isSharing.value = true;

    try
    {
      const zip = new JSZip();
      const projectPath = `projects/${idProject.value}`;

      // Get list of files in project directory
      let files: string[] = [];

      try
      {
        files = await fileManager.listDirectory(projectPath);
      }
      catch
      {
        // Directory might not exist or be empty
        files = [];
      }

      // Add each file to the zip
      for (const filename of files)
      {
        try
        {
          const filePath = `${projectPath}/${filename}`;
          const fileData = await fileManager.read(filePath);

          if (fileData)
          {
            zip.file(filename, fileData);
          }
        }
        catch (err)
        {
          console.warn(`Failed to read file ${filename}:`, err);
        }
      }

      // Generate zip as Uint8Array
      const zipData = await zip.generateAsync({ type: 'uint8array' });
      const sanitizedName = project.value.name.replace(/[^a-zA-Z0-9-_]/g, '_');
      const filename = `${sanitizedName}.zip`;

      if (Capacitor.isNativePlatform())
      {
        const base64Data = uint8ArrayToBase64(zipData);

        const writeResult = await Filesystem.writeFile({
          path: filename,
          data: base64Data,
          directory: Directory.Cache,
        });

        try
        {
          await Share.share({
            files: [writeResult.uri],
          });
        }
        catch
        {
          // User dismissed share dialog - not an error
        }
      }
      else
      {
        const blob = new Blob([zipData.buffer as ArrayBuffer], { type: 'application/zip' });
        downloadBlobAsFile(blob, filename);
      }
    }
    catch (err)
    {
      console.error('Failed to share project:', err);
      show(ToastNotification, {
        message: t('project.shareError'),
        type: ToastType.ERROR
      });
    }
    finally
    {
      isSharing.value = false;
    }
  };

  // Provide project context to child components
  provideProjectContext({
    project,
    isLoading,
    error,
    saveProject,
    reloadProject: loadProject
  });

  onMounted(async () =>
  {
    await loadProject();
  });
</script>

<style scoped>
  .drawer-enter-active,
  .drawer-leave-active
  {
    transition: all 0.2s ease-out;
    max-height: 500px;
  }

  .drawer-enter-from,
  .drawer-leave-to
  {
    max-height: 0;
    opacity: 0;
  }

  .fade-enter-active,
  .fade-leave-active
  {
    transition: opacity 0.2s ease-out;
  }

  .fade-enter-from,
  .fade-leave-to
  {
    opacity: 0;
  }
</style>
