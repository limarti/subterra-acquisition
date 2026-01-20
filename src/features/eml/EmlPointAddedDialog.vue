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

        <!-- GPS Data Section -->
        <div>
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

        <!-- Layer info -->
        <div class="mt-4 text-center text-text-secondary text-xs">
          Add to "{{ layerName }}"
        </div>

        <!-- Action buttons -->
        <div class="flex gap-3 mt-5">
          <button type="button"
                  class="flex-1 py-2.5 px-4 rounded bg-background-darker text-white/70 font-medium cursor-pointer hover:bg-background-darker/80 transition"
                  @click="handleDiscard">
            Discard
          </button>
          <button type="button"
                  class="flex-1 py-2.5 px-4 rounded bg-green-600 text-white font-medium cursor-pointer hover:bg-green-500 transition"
                  @click="handleConfirm">
            Confirm
          </button>
        </div>
      </div>
    </template>
  </GeoGenericDialog>
</template>

<script setup lang="ts">
  import { computed } from 'vue';
  import { closeDialog } from 'vue3-promise-dialog';
  import GeoGenericDialog from '@/generic/components/GeoGenericDialog.vue';
  import { parseEmlString } from '@/services/eml/utils/emlParser';
  import { parseNmeaGga } from '@/services/gps/utils/nmeaParser';
  import { formatCoordinateDMS } from '@/services/gps/utils/coordinateFormatter';
  import { getFixQualityLabel } from '@/services/gps/utils/fixQualityLabels';
  import { GpsFixQuality } from '@/services/gps/types/GpsFixQuality.enum';
  import type { NmeaGgaData } from '@/services/gps/types/NmeaGgaData.type';

  interface Props
  {
    emlRaw: string;
    gpsRaw: string;
    layerName: string;
  }

  const props = defineProps<Props>();

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

  const handleDiscard = () =>
  {
    closeDialog(false);
  };

  const handleConfirm = () =>
  {
    closeDialog(true);
  };

  defineExpose({ returnValue: () => false });
</script>

<style scoped>
  @reference "tailwindcss";
</style>
