<template>
  <div class="flex gap-1 relative z-10">
    <OverlayScrollbarsComponent class="flex-1 min-w-0">
      <div class="flex gap-1 pb-[1px]">
        <div v-for="tab in tabs"
             :key="tab.id"
             class="shrink-0 flex items-center text-sm font-medium transition-colors whitespace-nowrap rounded-t-lg focus:outline-none mb-[-1px] px-2"
             :class="[
               idTabActive === tab.id
                 ? 'text-white bg-background-lighter border-t-2 border-l border-r border-border-gray border-t-accent-primary'
                 : 'text-text-secondary bg-background-darker hover:text-white hover:bg-background-base border-t border-l border-r border-b border-border-gray'
             ]">
          <button class="px-2 pt-3 pb-[13px] focus:outline-none"
                  @click="$emit('tabChange', tab.id)">
            {{ tab.label }}
          </button>

          <!-- Kebab menu for selected tabs -->
          <div class="self-stretch">
            <GeoPopper v-if="idTabActive === tab.id && idTabsWithKebab.includes(tab.id)"
                       placement="bottom">
              <button type="button"
                      class="h-full flex items-center justify-center focus:outline-none hover:opacity-80 self-stretch"
                      aria-label="Tab options">
                <svg class="w-4 h-4"
                     viewBox="0 0 24 24"
                     fill="none"
                     stroke="currentColor"
                     stroke-width="2"
                     stroke-linecap="round">
                  <circle cx="12" cy="5" r="1" />
                  <circle cx="12" cy="12" r="1" />
                  <circle cx="12" cy="19" r="1" />
                </svg>
              </button>

              <template #content="{ close }">
                <div class="bg-background border border-accent-attention rounded shadow-lg min-w-36">
                  <div class="p-2">
                    <button type="button"
                            class="w-full flex items-center gap-3 px-3 py-2 text-sm text-white hover:bg-background-lighter rounded transition-colors"
                            @click="handleRename(tab.id, close)">
                      <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                      </svg>
                      {{ $t('project.rename') }}
                    </button>
                    <button type="button"
                            class="w-full flex items-center gap-3 px-3 py-2 text-sm text-white hover:bg-background-lighter rounded transition-colors"
                            @click="handleDelete(tab.id, close)">
                      <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <polyline points="3 6 5 6 21 6" />
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                      </svg>
                      {{ $t('common.delete') }}
                    </button>
                  </div>
                </div>
              </template>
            </GeoPopper>
          </div>
        </div>

        <button v-if="showNewButton"
                class="shrink-0 px-2.5 text-xl font-medium transition-colors whitespace-nowrap rounded-lg text-text-secondary bg-background-darker hover:text-white hover:bg-background-base border-t border-l border-r border-b border-border-gray focus:outline-none my-1 self-stretch flex items-center justify-center"
                @click="$emit('newTab')">
          +
        </button>
      </div>
    </OverlayScrollbarsComponent>

    <slot name="actions" />
  </div>
</template>

<script setup lang="ts">
  import { OverlayScrollbarsComponent } from 'overlayscrollbars-vue';
  import GeoPopper from './GeoPopper.vue';

  interface Tab
  {
    id: string;
    label: string;
  }

  interface Props
  {
    tabs: Tab[];
    idTabActive: string;
    showNewButton?: boolean;
    idTabsWithKebab?: string[];
  }

  interface Emits
  {
    tabChange: [tabId: string];
    newTab: [];
    renameTab: [tabId: string];
    deleteTab: [tabId: string];
  }

  withDefaults(defineProps<Props>(), {
    idTabsWithKebab: () => []
  });

  const emit = defineEmits<Emits>();

  const handleRename = (tabId: string, close: () => void) =>
  {
    close();
    emit('renameTab', tabId);
  };

  const handleDelete = (tabId: string, close: () => void) =>
  {
    close();
    emit('deleteTab', tabId);
  };
</script>

