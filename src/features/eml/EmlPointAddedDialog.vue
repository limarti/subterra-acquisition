<template>
  <GeoGenericDialog :showCloseButton="false">
    <template #icon>
      <svg class="w-5 h-5 text-blue-400" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 2L12 22M12 2L6 8M12 2L18 8" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
      </svg>
    </template>

    <template #title>
      New Point
    </template>

    <template #content>
      <div class="p-4">
        <!-- EML Data Section -->
        <div class="mb-4">
          <span class="text-[10px] text-gray-500 uppercase tracking-wide">EML Data</span>
          <div class="grid grid-cols-3 gap-2 mt-2">
            <div class="flex flex-col items-center p-3 bg-background-darker rounded">
              <span class="text-text-secondary text-[10px]">Depth</span>
              <span class="text-white font-medium text-sm">{{ emlData.depth }} {{ emlData.depthUnit }}</span>
            </div>
            <div class="flex flex-col items-center p-3 bg-background-darker rounded">
              <span class="text-text-secondary text-[10px]">Current</span>
              <span class="text-white font-medium text-sm">{{ emlData.current }} {{ emlData.currentUnit }}</span>
            </div>
            <div class="flex flex-col items-center p-3 bg-background-darker rounded">
              <span class="text-text-secondary text-[10px]">Frequency</span>
              <span class="text-white font-medium text-sm">{{ emlData.frequencyDisplay }}</span>
            </div>
          </div>
        </div>

        <!-- GPS Position Section -->
        <div class="mb-4">
          <span class="text-[10px] text-gray-500 uppercase tracking-wide">GPS Position</span>
          <div class="mt-2 p-3 bg-background-darker rounded">
            <template v-if="hasGpsData">
              <div class="grid grid-cols-2 gap-3">
                <div class="flex flex-col">
                  <span class="text-text-secondary text-[10px]">Latitude</span>
                  <span class="text-white font-mono text-xs">{{ formattedLatitude }}</span>
                </div>
                <div class="flex flex-col">
                  <span class="text-text-secondary text-[10px]">Longitude</span>
                  <span class="text-white font-mono text-xs">{{ formattedLongitude }}</span>
                </div>
              </div>
              <!-- RTK Warning -->
              <div v-if="isNotRtkFix" class="mt-3 p-2 bg-yellow-500/20 border border-yellow-500/50 rounded text-yellow-400 text-xs text-center">
                Position accuracy may be reduced (not RTK fix)
              </div>
              <div class="mt-3 pt-3 border-t border-border-gray">
                <div class="flex justify-between items-center">
                  <div class="flex flex-col">
                    <span class="text-text-secondary text-[10px]">Fix Quality</span>
                    <span class="font-medium text-sm" :class="fixQualityClass">{{ fixQualityLabel }}</span>
                  </div>
                  <div class="flex flex-col items-end">
                    <span class="text-text-secondary text-[10px]">Satellites</span>
                    <span class="text-white font-medium text-sm">{{ gpsData?.satellitesUsed ?? '-' }}</span>
                  </div>
                </div>
              </div>
            </template>
            <template v-else>
              <div class="text-center text-text-secondary text-sm py-2">
                No GPS fix available
              </div>
            </template>
          </div>
        </div>

        <!-- Manual Position Section -->
        <div>
          <div class="flex items-center justify-between">
            <span class="text-[10px] text-gray-500 uppercase tracking-wide">Manual Position</span>
            <button v-if="showManualInput"
                    type="button"
                    class="text-[10px] text-white/50 hover:text-white/70 transition"
                    @click="clearManualInput">
              Clear
            </button>
          </div>
          <div class="mt-2 p-3 bg-background-darker rounded">
            <template v-if="!showManualInput">
              <button type="button"
                      class="btn btn-sm bg-transparent text-white/60 border border-border-gray hover:text-white hover:border-white/50"
                      @click="showManualInput = true">
                + Add manual position
              </button>
            </template>
            <template v-else>
              <div class="grid grid-cols-2 gap-3">
                <div class="flex flex-col">
                  <label class="text-text-secondary text-[10px] mb-1">X (meters)</label>
                  <input v-model.number="manualX"
                         type="number"
                         step="0.01"
                         class="w-full px-2 py-1.5 bg-background-dark text-white text-sm rounded border border-border-gray focus:border-blue-500 focus:outline-none"
                         placeholder="0.00">
                </div>
                <div class="flex flex-col">
                  <label class="text-text-secondary text-[10px] mb-1">Y (meters)</label>
                  <input v-model.number="manualY"
                         type="number"
                         step="0.01"
                         class="w-full px-2 py-1.5 bg-background-dark text-white text-sm rounded border border-border-gray focus:border-blue-500 focus:outline-none"
                         placeholder="0.00">
                </div>
              </div>
            </template>
          </div>
        </div>

        <!-- Action buttons -->
        <div class="flex gap-3 mt-5">
          <button type="button"
                  class="btn btn-secondary flex-1"
                  @click="handleDiscard">
            Discard
          </button>
          <button type="button"
                  class="btn btn-success flex-1"
                  @click="handleConfirm">
            Confirm
          </button>
        </div>
      </div>
    </template>
  </GeoGenericDialog>
</template>

<script setup lang="ts">
  import { computed, ref } from 'vue';
  import { closeDialog } from 'vue3-promise-dialog';
  import GeoGenericDialog from '@/generic/components/GeoGenericDialog.vue';
  import { parseEmlString } from '@/services/eml/utils/emlParser';
  import { parseNmeaGga } from '@/services/gps/utils/nmeaParser';
  import { formatCoordinateDMS } from '@/services/gps/utils/coordinateFormatter';
  import { getFixQualityLabel } from '@/services/gps/utils/fixQualityLabels';
  import { GpsFixQuality } from '@/services/gps/types/GpsFixQuality.enum';
  import type { NmeaGgaData } from '@/services/gps/types/NmeaGgaData.type';

  export interface EmlDialogResult
  {
    confirmed: boolean;
    manualPosition?: { x: number; y: number };
  }

  interface Props
  {
    emlRaw: string;
    gpsRaw: string;
    layerName: string;
  }

  const props = defineProps<Props>();

  // Manual position entry state
  const showManualInput = ref(false);
  const manualX = ref<number | null>(null);
  const manualY = ref<number | null>(null);

  const emlData = computed(() => parseEmlString(props.emlRaw));

  const gpsData = computed<NmeaGgaData | null>(() =>
  {
    if (!props.gpsRaw)
    {
      return null;
    }

    try
    {
      return parseNmeaGga(props.gpsRaw);
    }
    catch
    {
      return null;
    }
  });

  const hasGpsData = computed(() =>
    gpsData.value !== null &&
    gpsData.value.isValid &&
    gpsData.value.latitude !== null &&
    gpsData.value.longitude !== null
  );

  const formattedLatitude = computed(() =>
    gpsData.value?.latitude !== null
      ? formatCoordinateDMS(gpsData.value!.latitude!, true)
      : '-'
  );

  const formattedLongitude = computed(() =>
    gpsData.value?.longitude !== null
      ? formatCoordinateDMS(gpsData.value!.longitude!, false)
      : '-'
  );

  const fixQualityLabel = computed(() =>
    gpsData.value ? getFixQualityLabel(gpsData.value.fixQuality) : '-'
  );

  const isNotRtkFix = computed(() =>
    hasGpsData.value && gpsData.value?.fixQuality !== GpsFixQuality.RTK_FIX
  );

  const fixQualityClass = computed(() =>
  {
    if (!gpsData.value)
    {
      return 'text-white';
    }

    switch (gpsData.value.fixQuality)
    {
    case GpsFixQuality.RTK_FIX:
      return 'text-green-400';
    case GpsFixQuality.RTK_FLOAT:
    case GpsFixQuality.DGPS_FIX:
      return 'text-yellow-400';
    case GpsFixQuality.INVALID:
      return 'text-red-400';
    default:
      return 'text-white';
    }
  });

  const clearManualInput = () =>
  {
    showManualInput.value = false;
    manualX.value = null;
    manualY.value = null;
  };

  const handleDiscard = () =>
  {
    closeDialog({ confirmed: false } as EmlDialogResult);
  };

  const handleConfirm = () =>
  {
    const result: EmlDialogResult = { confirmed: true };

    if (showManualInput.value && manualX.value !== null && manualY.value !== null)
    {
      result.manualPosition = { x: manualX.value, y: manualY.value };
    }

    closeDialog(result);
  };

  defineExpose({ returnValue: () => ({ confirmed: false } as EmlDialogResult) });
</script>

<style scoped>
  @reference "tailwindcss";
</style>
