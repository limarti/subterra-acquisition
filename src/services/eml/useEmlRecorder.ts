import { watch, onUnmounted, type Ref } from 'vue';
import { useEmlService } from './useEmlService';
import { useGpsService } from '@/services/gps/useGpsService';
import { useActiveLayerStore } from '@/features/projects/stores/useActiveLayerStore';
import { createEmlReading } from '@/features/projects/objects/objectUtils';
import { useToast } from '@/common/composables/useToast';
import { useDialog } from '@/generic/composables/useDialog';
import ToastNotification from '@/common/components/ToastNotification.vue';
import EmlPointAddedDialog, { type EmlDialogResult } from '@/features/eml/EmlPointAddedDialog.vue';
import { ToastType } from '@/common/types/ToastType';
import type { ProjectMetadata } from '@/features/projects/ProjectMetadata.type';
import type { Layer } from '@/features/projects/objects/ProjectObject.type';

const LOG_PREFIX = '📝 EML-Recorder:';
const log = (message: string, ...args: unknown[]) => console.log(`${LOG_PREFIX} ${message}`, ...args);
const logError = (message: string, ...args: unknown[]) => console.error(`${LOG_PREFIX} ${message}`, ...args);

const GPS_STALE_THRESHOLD_MS = 5000;

/**
 * EML Recorder Composable
 *
 * Records EML data to the active layer in the current project.
 * Each EML reading is stored with its timestamp and raw GPS NMEA sentence.
 *
 * @param project - Ref to the current project metadata
 * @param saveProject - Function to save the project
 */
export const useEmlRecorder = (
  project: Ref<ProjectMetadata | null>,
  saveProject: (project: ProjectMetadata) => Promise<void>
) =>
{
  const { subscribeToData } = useEmlService();
  const { lastRawNmea, lastGpsUpdateTime } = useGpsService();
  const activeLayerStore = useActiveLayerStore();
  const { show: showToast } = useToast();
  const { open: openDialog } = useDialog();

  let unsubscribe: (() => void) | null = null;
  let noLayerWarningShown = false;

  const handleEmlData = async (data: string) =>
  {
    if (!project.value)
    {
      return;
    }

    const activeLayer = activeLayerStore.getActiveLayer(project.value);

    if (!activeLayer)
    {
      // Only show warning once per session to avoid spam
      if (!noLayerWarningShown)
      {
        showToast(
          ToastNotification,
          { message: 'Create a layer first to record EML data', type: ToastType.WARNING },
          5000
        );
        noLayerWarningShown = true;
      }
      return;
    }

    // Reset warning flag when we have an active layer
    noLayerWarningShown = false;

    // Get the last raw NMEA sentence (empty if no GPS fix or data is stale)
    const isGpsFresh = (Date.now() - lastGpsUpdateTime.value) < GPS_STALE_THRESHOLD_MS;
    const gpsNmea = isGpsFresh ? (lastRawNmea.value || '') : '';

    // Show confirmation dialog before saving
    const result = await openDialog<EmlDialogResult>(EmlPointAddedDialog, {
      emlRaw: data,
      gpsRaw: gpsNmea,
      layerName: activeLayer.name
    });

    if (!result?.confirmed)
    {
      log('EML point discarded by user');
      return;
    }

    // Create the EML reading with optional manual position
    const emlReading = createEmlReading(data, gpsNmea, result.manualPosition);

    try
    {
      // Update the layer with the new reading
      const updatedLayers = project.value.layers.map((layer: Layer) =>
      {
        if (layer.id === activeLayer.id)
        {
          return {
            ...layer,
            objects: [...layer.objects, emlReading]
          };
        }
        return layer;
      });

      // Save the project with updated layers
      await saveProject({
        ...project.value,
        layers: updatedLayers
      });

      log(`Recorded EML reading to layer "${activeLayer.name}"`);
    }
    catch (error)
    {
      logError('Failed to save EML reading:', error);
    }
  };

  const startRecording = () =>
  {
    if (unsubscribe)
    {
      log('Already recording');
      return;
    }

    if (!project.value)
    {
      log('No project selected, cannot start recording');
      return;
    }

    log(`Starting EML recording for project: ${project.value.name}`);
    unsubscribe = subscribeToData(handleEmlData);
  };

  const stopRecording = () =>
  {
    if (unsubscribe)
    {
      log('Stopping EML recording');
      unsubscribe();
      unsubscribe = null;
    }
  };

  // Auto-start/stop recording when project changes
  watch(
    () => project.value,
    (newProject) =>
    {
      if (newProject)
      {
        startRecording();
      }
      else
      {
        stopRecording();
      }
    },
    { immediate: true }
  );

  onUnmounted(() =>
  {
    stopRecording();
  });

  return {
    startRecording,
    stopRecording
  };
};
