<template>
  <div class="h-full flex flex-col">
    <NavigationBar :showBackButton="true" @back="navigateBack">
      <template #left>
        <PageTitle :label="$t('settings.title')" content="" />
      </template>
    </NavigationBar>

    <OverlayScrollbarsComponent class="flex-1 overflow-y-auto px-6 pt-6 pb-4">
      <div style="container-type: inline-size;" class="max-w-5xl mx-auto">
        <MasonryGrid class="masonry-cols-1 @xl:masonry-cols-2">
          <!-- User Preferences -->
          <Card :title="$t('settings.user_preferences.title')">
            <div class="flex flex-col rounded-b-sm p-4 gap-2">

              <!-- Units button -->
              <div class="w-full">
                <button class="flex items-center cursor-pointer justify-between w-full px-3 py-2 rounded-md border border-border-gray" @click="() => open(UnitsDialog)">
                  <div class="flex items-center gap-2 text-gray-200">
                    <svg class="w-5 h-6" viewBox="0 0 28 29" xmlns="http://www.w3.org/2000/svg">
                      <path d="M14 16.25H26.25H28V18V26.75V28.5H26.25H12.25H1.75H0V26.75V16.25V2.25V0.5H1.75H10.5H12.25V2.25V14.5V16.25H14ZM21 18H17.5V21.5V22.375H15.75V21.5V18H12.25V21.5V22.375H10.5V21.5V18H7H6.125V16.25H7H10.5V12.75H7H6.125V11H7H10.5V7.5H7H6.125V5.75H7H10.5V2.25H1.75V16.25V26.75H12.25H26.25V18H22.75V21.5V22.375H21V21.5V18Z" fill="var(--color-accent-primary)" stroke-width="0.5" />
                    </svg>

                    <span>{{ $t('settings.units.label') }}</span>
                  </div>

                  <div class="flex items-center gap-1 text-gray-400">
                    <span>{{ userSettingsStore.units }}</span>
                    <svg class="w-6 h-6" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M9 18L15 12L9 6" stroke="white" stroke-width="1" stroke-linecap="round" stroke-linejoin="round" />
                    </svg>
                  </div>
                </button>
              </div>

              <!-- Language button -->
              <div class="w-full">
                <button class="flex items-center cursor-pointer justify-between w-full px-3 py-2 rounded-md border border-border-gray" @click="() => open(LanguageDialog)">
                  <div class="flex items-center gap-2 text-gray-200">
                    <svg class="w-6 h-6" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke="var(--color-accent-primary)" stroke-width="1.5" d="m10.5 21 5.25-11.25L21 21m-9-3h7.5M3 5.621a48.474 48.474 0 0 1 6-.371m0 0c1.12 0 2.233.038 3.334.114M9 5.25V3m3.334 2.364C11.176 10.658 7.69 15.08 3 17.502m9.334-12.138c.896.061 1.785.147 2.666.257m-4.589 8.495a18.023 18.023 0 0 1-3.827-5.802" />
                    </svg>

                    {{ $t('settings.language.label') }}
                  </div>

                  <div class="flex items-center gap-1 text-gray-400">
                    <img :src="`/images/flags/${userSettingsStore.getCurrentLanguageFlag()}.svg`"
                         :alt="`${userSettingsStore.getCurrentLanguageFlag()} flag`"
                         class="w-6 h-6">
                    <svg class="w-6 h-6" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M9 18L15 12L9 6" stroke="white" stroke-width="1" stroke-linecap="round" stroke-linejoin="round" />
                    </svg>
                  </div>
                </button>
              </div>

            </div>
          </Card>

          <!-- GPS Connection -->
          <GpsConnectionPanel />

          <!-- System Logs -->
          <DownloadLogsPanel v-if="featureFlags.showSystemLogs" />
        </MasonryGrid>
      </div>
    </OverlayScrollbarsComponent>
  </div>
</template>

<script setup lang="ts">
  import { useRouter } from 'vue-router';
  import { useDialog } from '@/generic/composables/useDialog';
  import NavigationBar from '@/common/components/NavigationBar.vue';
  import MasonryGrid from '@/common/components/MasonryGrid.vue';
  import PageTitle from '@/common/components/PageTitle.vue';
  import Card from '@/features/dashboard/Card.vue';
  import UnitsDialog from '@/features/dashboard/UnitsDialog.vue';
  import LanguageDialog from '@/features/dashboard/LanguageDialog.vue';
  import GpsConnectionPanel from '../gps/GpsConnectionPanel.vue';
  import DownloadLogsPanel from './DownloadLogsPanel.vue';
  import { useUserSettingsStore } from '@/common/stores/useUserSettingsStore';
  import { OverlayScrollbarsComponent } from 'overlayscrollbars-vue';
  import { getFeatureFlags } from '@/common/utils/featureFlags';

  const router = useRouter();
  const featureFlags = getFeatureFlags();
  const userSettingsStore = useUserSettingsStore();

  const { open } = useDialog();

  const navigateBack = () =>
  {
    router.push({ name: 'dashboard' });
  };
</script>
