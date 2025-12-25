<template>
  <IndicatorWrapper :buttonAriaLabel="'GPS connection status'">
    <template #icon>
      <div class="relative w-5 h-5">
        <template v-if="isGpsDisabled">
          <svg class="w-5 h-5"
               xmlns="http://www.w3.org/2000/svg"
               fill="none"
               viewBox="0 0 24 24"
               stroke-width="1.5"
               stroke="gray"
               opacity="0.5">
            <path stroke-linecap="round"
                  stroke-linejoin="round"
                  d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
            <path stroke-linecap="round"
                  stroke-linejoin="round"
                  d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" />
          </svg>
        </template>

        <!-- Connected with RTK FIX (green dot) -->
        <template v-else-if="connectionState === GpsConnectionState.CONNECTED && isRtkFix && !isPositionStale">
          <svg class="w-5 h-5"
               xmlns="http://www.w3.org/2000/svg"
               fill="none"
               viewBox="0 0 24 24"
               stroke-width="1.5"
               stroke="white">
            <path stroke-linecap="round"
                  stroke-linejoin="round"
                  d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
            <path stroke-linecap="round"
                  stroke-linejoin="round"
                  d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" />
          </svg>
          <div class="absolute -top-0.5 -right-0.5 w-2 h-2 bg-green-500 rounded-full" />
        </template>

        <!-- Connected with valid position but not RTK (yellow dot) -->
        <template v-else-if="connectionState === GpsConnectionState.CONNECTED && hasValidPosition && !isPositionStale">
          <svg class="w-5 h-5"
               xmlns="http://www.w3.org/2000/svg"
               fill="none"
               viewBox="0 0 24 24"
               stroke-width="1.5"
               stroke="white">
            <path stroke-linecap="round"
                  stroke-linejoin="round"
                  d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
            <path stroke-linecap="round"
                  stroke-linejoin="round"
                  d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" />
          </svg>
          <div class="absolute -top-0.5 -right-0.5 w-2 h-2 bg-yellow-500 rounded-full" />
        </template>

        <!-- Disconnected or no valid position (red bar) -->
        <template v-else>
          <svg class="w-5 h-5"
               xmlns="http://www.w3.org/2000/svg"
               fill="none"
               viewBox="0 0 24 24"
               stroke-width="1.5"
               stroke="white">
            <g class="animate-flashy-opacity">
              <path stroke-linecap="round"
                    stroke-linejoin="round"
                    d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
              <path stroke-linecap="round"
                    stroke-linejoin="round"
                    d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" />
            </g>
            <line x1="3"
                  y1="21"
                  x2="21"
                  y2="3"
                  stroke="var(--color-background)"
                  stroke-width="4"
                  stroke-linecap="round" />
            <line x1="3"
                  y1="21"
                  x2="21"
                  y2="3"
                  stroke="red"
                  stroke-width="2"
                  stroke-linecap="round" />
          </svg>
        </template>
      </div>
    </template>

    <template #content>
      <div class="p-3 w-44">
        <div class="flex flex-col">
          <template v-if="isGpsDisabled">
            <span class="font-medium text-gray-400">{{ $t('common.disabled') }}</span>
          </template>
          <template v-else-if="connectionState === GpsConnectionState.CONNECTED && !isPositionStale">
            <div class="flex flex-col mb-2">
              <span class="text-[10px] text-gray-500 uppercase">{{ $t('gps.device') }}</span>
              <span class="text-sm text-white font-medium">{{ connectedDevice?.name }}</span>
            </div>
            <span class="text-[10px] text-gray-500 uppercase">{{ $t('gps.position') }}</span>
            <div class="font-mono text-xs text-white tracking-wide">
              {{ formattedLatitude }}
            </div>
            <div class="font-mono text-xs text-white tracking-wide">
              {{ formattedLongitude }}
            </div>
            <div class="flex flex-col mt-2">
              <span class="text-[10px] text-gray-500 uppercase">{{ $t('gps.fix') }}</span>
              <span class="text-sm font-medium"
                    :class="isRtkFix ? 'text-green-400' : 'text-white'">
                {{ fixQualityLabel }}
              </span>
            </div>
            <div class="flex flex-col mt-1">
              <span class="text-[10px] text-gray-500 uppercase">{{ $t('gps.satellites') }}</span>
              <span class="text-sm text-white font-medium">{{ satellitesUsed }}</span>
            </div>
          </template>
          <template v-else-if="connectionState === GpsConnectionState.CONNECTED && isPositionStale">
            <div class="flex flex-col mb-2">
              <span class="text-[10px] text-gray-500 uppercase">{{ $t('gps.device') }}</span>
              <span class="text-sm text-white font-medium">{{ connectedDevice?.name }}</span>
            </div>
            <div class="flex flex-col mt-2">
              <span class="text-[10px] text-gray-500 uppercase">{{ $t('common.status') }}</span>
              <span class="text-sm text-yellow-400">{{ $t('gps.waiting_for_fix') }}</span>
            </div>
          </template>
          <template v-else>
            <span class="font-medium text-gray-400">{{ $t('common.not_connected') }}</span>
            <span v-if="connectionState === GpsConnectionState.CONNECTING"
                  class="text-xs text-gray-500 mt-1">
              {{ $t('common.reconnecting') }}...
            </span>
          </template>
        </div>
      </div>
    </template>
  </IndicatorWrapper>
</template>

<script setup lang="ts">
  import { ref, computed, onMounted, onUnmounted } from 'vue';
  import { useGpsService } from '@/services/gps/useGpsService';
  import { useUserSettingsStore } from '@/common/stores/useUserSettingsStore';
  import { GpsConnectionState } from '@/services/gps/types/GpsConnectionState.enum';
  import { GpsConnectionType } from '@/services/gps/types/GpsConnectionType.enum';
  import { GpsFixQuality } from '@/services/gps/types/GpsFixQuality.enum';
  import type { NmeaGgaData } from '@/services/gps/types/NmeaGgaData.type';
  import { formatCoordinateDMS } from '@/services/gps/utils/coordinateFormatter';
  import IndicatorWrapper from './IndicatorWrapper.vue';

  const STALE_POSITION_TIMEOUT_MS = 5000;

  const fixQualityLabels: Record<GpsFixQuality, string> = {
    [GpsFixQuality.INVALID]: 'Invalid',
    [GpsFixQuality.GPS_FIX]: 'GPS',
    [GpsFixQuality.DGPS_FIX]: 'DGPS',
    [GpsFixQuality.PPS_FIX]: 'PPS',
    [GpsFixQuality.RTK_FIX]: 'RTK FIX',
    [GpsFixQuality.RTK_FLOAT]: 'Float',
    [GpsFixQuality.ESTIMATED]: 'Estimated',
    [GpsFixQuality.MANUAL]: 'Manual',
    [GpsFixQuality.SIMULATION]: 'Sim',
  };

  const { connectionState, connectedDevice, subscribeToLocationData } = useGpsService();
  const userSettingsStore = useUserSettingsStore();

  const isGpsDisabled = computed(() => userSettingsStore.gpsConnectionType === GpsConnectionType.DISABLED);

  const latestFixQuality = ref<GpsFixQuality>(GpsFixQuality.INVALID);
  const hasValidPosition = ref(false);
  const isRtkFix = ref(false);
  const latitude = ref<number | null>(null);
  const longitude = ref<number | null>(null);
  const satellitesUsed = ref(0);
  const isPositionStale = ref(true);

  const formattedLatitude = computed(() =>
    latitude.value !== null ? formatCoordinateDMS(latitude.value, true) : ''
  );

  const formattedLongitude = computed(() =>
    longitude.value !== null ? formatCoordinateDMS(longitude.value, false) : ''
  );

  const fixQualityLabel = computed(() => fixQualityLabels[latestFixQuality.value]);

  let unsubscribe: (() => void) | null = null;
  let stalePositionTimeout: number | null = null;

  const handleGpsData = (data: NmeaGgaData) =>
  {
    latestFixQuality.value = data.fixQuality;
    hasValidPosition.value = data.isValid && data.fixQuality > GpsFixQuality.INVALID;
    isRtkFix.value = data.fixQuality === GpsFixQuality.RTK_FIX;
    latitude.value = data.latitude;
    longitude.value = data.longitude;
    satellitesUsed.value = data.satellitesUsed;

    if (hasValidPosition.value)
    {
      isPositionStale.value = false;

      if (stalePositionTimeout !== null)
      {
        clearTimeout(stalePositionTimeout);
      }

      stalePositionTimeout = window.setTimeout(() =>
      {
        isPositionStale.value = true;
      }, STALE_POSITION_TIMEOUT_MS);
    }
  };

  onMounted(() =>
  {
    unsubscribe = subscribeToLocationData(handleGpsData);
  });

  onUnmounted(() =>
  {
    if (unsubscribe)
    {
      unsubscribe();
    }

    if (stalePositionTimeout !== null)
    {
      clearTimeout(stalePositionTimeout);
    }
  });
</script>

<style scoped>
@keyframes flashy-opacity {
  0% {
    opacity: 1;
  }
  15% {
    opacity: 0.2;
  }
  30% {
    opacity: 1;
  }
  45% {
    opacity: 0.2;
  }
  60%, 100% {
    opacity: 1;
  }
}

.animate-flashy-opacity {
  animation: flashy-opacity 2s ease-in-out infinite;
}
</style>
