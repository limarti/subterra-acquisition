<template>
  <div class="h-full flex flex-col">
    <NavigationBar :showBackButton="true" @back="navigateBack">
      <template v-if="project" #left>
        <PageTitle :label="$t('project.label')" :content="project.name" />
      </template>

    </NavigationBar>

    <!-- Main content -->
    <OverlayScrollbarsComponent class="flex-1 px-6 py-6 h-full project-view-scroller">
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

      <div v-else-if="project" class="flex flex-col h-full">
        <!-- Tab Bar -->
        <TabBar :tabs="tabs"
                :idTabActive="idTabActive"
                :showNewButton="true"
                :idTabsWithKebab="idAOITabs"
                @tabChange="handleTabChange"
                @newTab="handleNewAOI"
                @renameTab="handleRenameAOI"
                @deleteTab="handleDeleteAOI">
          <template #actions>
            <div class="flex gap-1 items-end mr-5">
              <!-- Selection delete button -->
              <ProjectActionButton v-if="currentTab?.type === 'aoi' && idSelectedItems.size > 0"
                                   :title="$t('common.delete')"
                                   @click="handleDelete">
                <svg class="w-5 h-5"
                     viewBox="0 0 24 24"
                     fill="none"
                     stroke="currentColor"
                     stroke-width="2"
                     stroke-linecap="round"
                     stroke-linejoin="round">
                  <path d="M19 7L18.1327 19.1425C18.0579 20.1891 17.187 21 16.1378 21H7.86224C6.81296 21 5.94208 20.1891 5.86732 19.1425L5 7M10 11V17M14 11V17M15 7V4C15 3.44772 14.5523 3 14 3H10C9.44772 3 9 3.44772 9 4V7M4 7H20" />
                </svg>
              </ProjectActionButton>

              <!-- Project kebab menu -->
              <GeoPopper placement="bottom-end">
                <ProjectActionButton :title="$t('project.projectActions')">
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
                </ProjectActionButton>

                <template #content="{ close }">
                  <div class="bg-background border border-accent-attention rounded shadow-lg min-w-36">
                    <div class="p-2">
                      <button type="button"
                              class="w-full flex items-center gap-3 px-3 py-2 text-sm text-white hover:bg-background-lighter rounded transition-colors"
                              @click="close(); handleProjectDelete();">
                        <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                          <polyline points="3 6 5 6 21 6" />
                          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                        </svg>
                        {{ $t('project.deleteProject') }}
                      </button>
                    </div>
                  </div>
                </template>
              </GeoPopper>
            </div>
          </template>
        </TabBar>

        <!-- Tab Content -->
        <div class="bg-background-lighter border-t border-b border-l border-r border-border-gray rounded-b-lg rounded-tr-lg min-h-0 flex-1 mt-[-1px]">
          <OverlayScrollbarsComponent class="h-full">
            <div class="h-full flex flex-col min-h-0">
              <ProjectMetadataTab v-if="idTabActive === 'details'"
                                  :project="project"
                                  @save="handleProjectSave" />
              <ProjectMapTab v-else-if="idTabActive === 'map'" />
              <AOIContentTab v-else-if="currentArea"
                             :area="currentArea"
                             :idProject="project.id"
                             @selectionChange="handleSelectionChange" />
            </div>
          </OverlayScrollbarsComponent>
        </div>
      </div>

      <div v-else class="flex items-center justify-center h-full">
        <p class="text-text-secondary">
          {{ $t('project.notFound') }}
        </p>
      </div>
    </OverlayScrollbarsComponent>
  </div>
</template>

<script setup lang="ts">
  import { ref, computed, onMounted } from 'vue';
  import { useRouter, useRoute } from 'vue-router';
  import { useI18n } from 'vue-i18n';
  import { OverlayScrollbarsComponent } from 'overlayscrollbars-vue';
  import NavigationBar from '@/common/components/NavigationBar.vue';
  import PageTitle from '@/common/components/PageTitle.vue';
  import TabBar from '@/common/components/TabBar.vue';
  import ProjectMetadataTab from './ProjectMetadataTab.vue';
  import ProjectMapTab from './ProjectMapTab.vue';
  import AOIContentTab from './aoi/AOIContentTab.vue';
  import AOINameDialog from './aoi/AOINameDialog.vue';
  import ProjectActionButton from './ProjectActionButton.vue';
  import GeoPopper from '@/common/components/GeoPopper.vue';
  import GeoConfirmationDialog from '@/generic/components/GeoConfirmationDialog.vue';
  import { useProjectsStorage } from './useProjectsStorage';
  import { useDialog } from '@/generic/composables/useDialog';
  import { useToast } from '@/common/composables/useToast';
  import type { ProjectMetadata } from './ProjectMetadata.type';
  import { createDefaultAOI } from './projectUtils';
  import ToastNotification from '@/common/components/ToastNotification.vue';
  import { ToastType } from '@/common/types/ToastType';

  const router = useRouter();
  const route = useRoute();
  const { t } = useI18n();
  const { open } = useDialog();
  const { getProject, saveProject, deleteProject } = useProjectsStorage();
  const { show } = useToast();

  const project = ref<ProjectMetadata | null>(null);
  const isLoading = ref(false);
  const error = ref<string | null>(null);
  const idTabActive = ref('details');
  const idSelectedItems = ref<Set<string>>(new Set());
  const isDeleting = ref(false);

  interface TabData
  {
    id: string;
    label: string;
    type: 'details' | 'map' | 'aoi';
  }

  const tabs = computed<TabData[]>(() =>
  {
    if (!project.value) return [];

    const baseTabs: TabData[] = [
      { id: 'details', label: t('project.details'), type: 'details' },
      { id: 'map', label: t('project.map'), type: 'map' }
    ];

    const aoiTabs: TabData[] = project.value.areas.map((area) => ({
      id: area.id,
      label: area.name,
      type: 'aoi'
    }));

    return [...baseTabs, ...aoiTabs];
  });

  const currentTab = computed(() =>
  {
    return tabs.value.find((tab) => tab.id === idTabActive.value);
  });

  const currentArea = computed(() =>
  {
    if (!project.value || !currentTab.value || currentTab.value.type !== 'aoi')
    {
      return null;
    }

    return project.value.areas.find((area) => area.id === idTabActive.value) ?? null;
  });

  const idAOITabs = computed(() =>
  {
    if (!project.value) return [];
    return project.value.areas.map((area) => area.id);
  });

  const handleTabChange = (idTab: string) =>
  {
    idTabActive.value = idTab;
    idSelectedItems.value.clear();
  };

  const handleSelectionChange = (selectedIds: Set<string>) =>
  {
    idSelectedItems.value = selectedIds;
  };

  const handleDelete = async () =>
  {
    const itemIdsToDelete = Array.from(idSelectedItems.value);
    if (!currentArea.value || !project.value) return;

    const resultsToDelete = currentArea.value.results.filter((result) => itemIdsToDelete.includes(result.id));

    const elementsCount = resultsToDelete.length;
    const singleName = resultsToDelete[0]?.name ?? resultsToDelete[0]?.id;

    const message = elementsCount === 1
      ? t('project.confirmDeleteSingle', { name: singleName })
      : t('project.confirmDeleteMultiple', { count: elementsCount });

    // Show confirmation dialog
    const confirmed = await open(GeoConfirmationDialog, {
      title: t('project.confirmDeleteTitle'),
      message,
      confirmText: t('common.delete'),
      cancelText: t('common.cancel')
    });

    if (!confirmed) return;

    currentArea.value.results = currentArea.value.results.filter((result) => !itemIdsToDelete.includes(result.id));

    await saveProject(project.value);

    idSelectedItems.value.clear();
  };

  const handleProjectSave = async (updates: Partial<ProjectMetadata>) =>
  {
    if (!project.value) return;

    project.value.name = updates.name!;
    project.value.clientName = updates.clientName!;
    project.value.jobCode = updates.jobCode!;

    await saveProject(project.value);
  };

  const handleNewAOI = async () =>
  {
    if (!project.value) return;

    const nextAOINumber = project.value.areas.length + 1;
    const defaultName = `AOI ${nextAOINumber}`;

    const aoiName = await open(AOINameDialog, { defaultName });

    if (aoiName)
    {
      const newArea = createDefaultAOI(aoiName);

      project.value.areas.push(newArea);

      await saveProject(project.value);

      // Switch to the new AOI tab
      idTabActive.value = newArea.id;
    }
  };

  const handleRenameAOI = async (idAOI: string) =>
  {
    if (!project.value) return;

    const area = project.value.areas.find((a) => a.id === idAOI);
    if (!area) return;

    const newName = await open(AOINameDialog, { defaultName: area.name, mode: 'rename' });

    if (newName && newName !== area.name)
    {
      area.name = newName;
      await saveProject(project.value);
    }
  };

  const handleDeleteAOI = async (idAOI: string) =>
  {
    if (!project.value) return;

    const area = project.value.areas.find((a) => a.id === idAOI);
    if (!area) return;

    const resultCount = area.results?.length ?? 0;
    const hasData = resultCount > 0;

    const message = hasData
      ? t('project.confirmDeleteAOIWithData', { name: area.name, resultCount })
      : t('project.confirmDeleteAOI', { name: area.name });

    const confirmed = await open(GeoConfirmationDialog, {
      title: t('project.deleteAOI'),
      message,
      confirmText: t('common.delete'),
      cancelText: t('common.cancel')
    });

    if (!confirmed) return;

    // Remove the AOI from the project
    project.value.areas = project.value.areas.filter((a) => a.id !== idAOI);

    await saveProject(project.value);

    // Switch to a different tab
    if (idTabActive.value === idAOI)
    {
      idTabActive.value = 'details';
    }
  };

  const loadProject = async () =>
  {
    const idProject = route.params.idProject as string;

    if (!idProject)
    {
      error.value = t('project.error');
      return;
    }

    isLoading.value = true;
    error.value = null;

    try
    {
      const loadedProject = await getProject(idProject);

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

  const navigateBack = () =>
  {
    router.push({ name: 'dashboard' });
  };

  const handleProjectDelete = async () =>
  {
    if (!project.value || isDeleting.value) return;

    const projectName = project.value.name;
    const idProject = project.value.id;

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
      await deleteProject(idProject);

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

  onMounted(async () =>
  {
    await loadProject();

    const idAOI = route.query.idAOI as string | undefined;
    if (idAOI && project.value)
    {
      const area = project.value.areas.find(area => area.id === idAOI);
      if (area)
      {
        idTabActive.value = area.id;
      }
    }
  });
</script>

