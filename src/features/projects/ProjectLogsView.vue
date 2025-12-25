<template>
  <OverlayScrollbarsComponent class="h-full">
    <div class="p-4">
      <div class="flex items-center justify-between mb-4">
        <h2 class="text-lg font-medium text-white">
          {{ $t('project.logs.title') }}
        </h2>
        <button type="button"
                class="px-3 py-1.5 text-sm bg-background-lighter hover:bg-background-light rounded transition-colors text-white"
                :disabled="isLoading"
                @click="loadLogs">
          <span v-if="isLoading">{{ $t('common.loading') }}</span>
          <span v-else>{{ $t('project.logs.refresh') }}</span>
        </button>
      </div>

      <!-- Log type tabs -->
      <div class="flex gap-1 mb-4 bg-background-lighter rounded-lg p-1">
        <button v-for="logType in logTypes"
                :key="logType.id"
                type="button"
                class="flex-1 px-3 py-2 text-sm rounded-md transition-colors"
                :class="selectedLogType === logType.id
                  ? 'bg-accent-info text-white'
                  : 'text-gray-400 hover:text-white hover:bg-background-light'"
                @click="selectLogType(logType.id)">
          {{ $t(logType.labelKey) }}
        </button>
      </div>

      <!-- Empty state -->
      <div v-if="!isLoading && logs.length === 0" class="flex flex-col items-center justify-center py-12 text-center">
        <svg class="w-12 h-12 text-gray-600 mb-4"
             viewBox="0 0 24 24"
             fill="none"
             stroke="currentColor"
             stroke-width="1.5">
          <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        <p class="text-gray-500">{{ $t(currentLogTypeConfig.emptyKey) }}</p>
        <p class="text-gray-600 text-sm mt-1">{{ $t(currentLogTypeConfig.emptyHintKey) }}</p>
      </div>

      <!-- Logs list -->
      <div v-else class="space-y-1">
        <div v-for="(log, index) in logs"
             :key="index"
             class="bg-background-lighter rounded p-2 font-mono text-xs">
          <div class="flex items-start gap-2">
            <span class="text-gray-500 whitespace-nowrap">{{ formatTimestamp(log.timestamp) }}</span>
            <span class="text-white break-all">{{ log.data }}</span>
          </div>
        </div>
      </div>

      <!-- Log count -->
      <div v-if="logs.length > 0" class="mt-4 text-center text-sm text-gray-500">
        {{ $t('project.logs.count', { count: logs.length }) }}
      </div>
    </div>
  </OverlayScrollbarsComponent>
</template>

<script setup lang="ts">
  import { ref, computed, onMounted } from 'vue';
  import { OverlayScrollbarsComponent } from 'overlayscrollbars-vue';
  import { useProjectContext } from './useProjectContext';
  import { useFileManager } from '@/services/files/composables/useFileManager';

  interface LogEntry
  {
    timestamp: number;
    data: string;
  }

  interface LogTypeConfig
  {
    id: string;
    filename: string;
    labelKey: string;
    emptyKey: string;
    emptyHintKey: string;
  }

  const logTypes: LogTypeConfig[] = [
    {
      id: 'eml',
      filename: 'eml.txt',
      labelKey: 'project.logs.types.eml',
      emptyKey: 'project.logs.emptyEml',
      emptyHintKey: 'project.logs.emptyEmlHint'
    },
    {
      id: 'gps',
      filename: 'gps.txt',
      labelKey: 'project.logs.types.gps',
      emptyKey: 'project.logs.emptyGps',
      emptyHintKey: 'project.logs.emptyGpsHint'
    }
  ];

  const { project } = useProjectContext();
  const fileManager = useFileManager();

  const logs = ref<LogEntry[]>([]);
  const isLoading = ref(false);
  const selectedLogType = ref<string>('eml');

  const currentLogTypeConfig = computed((): LogTypeConfig =>
  {
    return logTypes.find(t => t.id === selectedLogType.value) ?? logTypes[0]!;
  });

  const getLogFilePath = (): string | null =>
  {
    if (!project.value)
    {
      return null;
    }

    return `projects/${project.value.id}/${currentLogTypeConfig.value.filename}`;
  };

  const selectLogType = (logTypeId: string) =>
  {
    selectedLogType.value = logTypeId;
    loadLogs();
  };

  const parseLogLine = (line: string): LogEntry | null =>
  {
    const commaIndex = line.indexOf(',');

    if (commaIndex === -1)
    {
      return null;
    }

    const timestampStr = line.substring(0, commaIndex);
    const data = line.substring(commaIndex + 1);
    const timestamp = parseInt(timestampStr, 10);

    if (isNaN(timestamp))
    {
      return null;
    }

    return { timestamp, data };
  };

  const loadLogs = async () =>
  {
    const filePath = getLogFilePath();

    if (!filePath)
    {
      return;
    }

    isLoading.value = true;

    try
    {
      const fileData = await fileManager.read(filePath);

      if (!fileData)
      {
        logs.value = [];
        return;
      }

      const content = new TextDecoder().decode(fileData);
      const lines = content.split('\n').filter(line => line.trim());

      const parsedLogs: LogEntry[] = [];

      for (const line of lines)
      {
        const entry = parseLogLine(line);

        if (entry)
        {
          parsedLogs.push(entry);
        }
      }

      // Show newest first
      logs.value = parsedLogs.reverse();
    }
    catch (error)
    {
      console.error('Failed to load logs:', error);
      logs.value = [];
    }
    finally
    {
      isLoading.value = false;
    }
  };

  const formatTimestamp = (timestamp: number): string =>
  {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    });
  };

  onMounted(() =>
  {
    loadLogs();
  });
</script>
