import { watch, onUnmounted, type Ref } from 'vue';
import { useEmlService } from './useEmlService';
import { useFileManager } from '@/services/files/composables/useFileManager';
import type { ProjectMetadata } from '@/features/projects/ProjectMetadata.type';

const LOG_PREFIX = '📝 EML-Logger:';
const log = (message: string, ...args: unknown[]) => console.log(`${LOG_PREFIX} ${message}`, ...args);
const logError = (message: string, ...args: unknown[]) => console.error(`${LOG_PREFIX} ${message}`, ...args);

/**
 * EML Logger Composable
 *
 * Logs EML data to the current project's eml.txt file.
 * Format: {unix_epoch},{data}\n
 *
 * @param project - Ref to the current project metadata
 */
export const useEmlLogger = (project: Ref<ProjectMetadata | null>) =>
{
  const { subscribeToData } = useEmlService();
  const fileManager = useFileManager();

  let unsubscribe: (() => void) | null = null;

  const getLogFilePath = (): string | null =>
  {
    if (!project.value)
    {
      return null;
    }

    return `projects/${project.value.id}/eml.txt`;
  };

  const handleEmlData = async (data: string) =>
  {
    const filePath = getLogFilePath();

    if (!filePath)
    {
      return;
    }

    const timestamp = Date.now();
    const logLine = `${timestamp},${data}\n`;

    try
    {
      await fileManager.append(logLine, filePath);
    }
    catch (error)
    {
      logError('Failed to append EML data:', error);
    }
  };

  const startLogging = () =>
  {
    if (unsubscribe)
    {
      log('Already logging');
      return;
    }

    if (!project.value)
    {
      log('No project selected, cannot start logging');
      return;
    }

    log(`Starting EML logging for project: ${project.value.name}`);
    unsubscribe = subscribeToData(handleEmlData);
  };

  const stopLogging = () =>
  {
    if (unsubscribe)
    {
      log('Stopping EML logging');
      unsubscribe();
      unsubscribe = null;
    }
  };

  // Auto-start/stop logging when project changes
  watch(
    () => project.value,
    (newProject) =>
    {
      if (newProject)
      {
        startLogging();
      }
      else
      {
        stopLogging();
      }
    },
    { immediate: true }
  );

  onUnmounted(() =>
  {
    stopLogging();
  });

  return {
    startLogging,
    stopLogging
  };
};
