<template>
  <IndicatorWrapper :buttonAriaLabel="'EML connection status'">
    <template #icon>
      <div class="relative w-5 h-5">
        <template v-if="isEmlDisabled">
          <svg class="w-5 h-5 rotate-180"
               xmlns="http://www.w3.org/2000/svg"
               viewBox="0 0 980 1000"
               fill="gray"
               opacity="0.5">
            <path d="M490 700c28 0 51.667 10 71 30c19.333 20 29 43.333 29 70c0 28 -9.667 51.667 -29 71c-19.333 19.333 -43 29 -71 29c-26.667 0 -49.667 -9.667 -69 -29c-19.333 -19.333 -29 -43 -29 -71c0 -26.667 9.667 -50 29 -70c19.333 -20 42.333 -30 69 -30c0 0 0 0 0 0m-210 -112c58.667 -58.667 128.667 -88 210 -88c81.333 0 151.333 29.333 210 88c0 0 -70 72 -70 72c-38.667 -38.667 -85.333 -58 -140 -58c-54.667 0 -101.333 19.333 -140 58c0 0 -70 -72 -70 -72m-140 -140c97.333 -98.667 214.333 -148 351 -148c136.667 0 253 49.333 349 148c0 0 -70 70 -70 70c-77.333 -78.667 -170.333 -118 -279 -118c-108.667 0 -202.333 39.333 -281 118c0 0 -70 -70 -70 -70m-140 -142c136 -137.333 299.667 -206 491 -206c191.333 0 354.333 68.667 489 206c0 0 -70 70 -70 70c-116 -117.333 -256 -176 -420 -176c-164 0 -304 58.667 -420 176c0 0 -70 -70 -70 -70" />
          </svg>
        </template>

        <!-- Connected (green dot) -->
        <template v-else-if="connectionState === EmlConnectionState.CONNECTED">
          <svg class="w-5 h-5 rotate-180"
               xmlns="http://www.w3.org/2000/svg"
               viewBox="0 0 980 1000"
               fill="white">
            <path d="M490 700c28 0 51.667 10 71 30c19.333 20 29 43.333 29 70c0 28 -9.667 51.667 -29 71c-19.333 19.333 -43 29 -71 29c-26.667 0 -49.667 -9.667 -69 -29c-19.333 -19.333 -29 -43 -29 -71c0 -26.667 9.667 -50 29 -70c19.333 -20 42.333 -30 69 -30c0 0 0 0 0 0m-210 -112c58.667 -58.667 128.667 -88 210 -88c81.333 0 151.333 29.333 210 88c0 0 -70 72 -70 72c-38.667 -38.667 -85.333 -58 -140 -58c-54.667 0 -101.333 19.333 -140 58c0 0 -70 -72 -70 -72m-140 -140c97.333 -98.667 214.333 -148 351 -148c136.667 0 253 49.333 349 148c0 0 -70 70 -70 70c-77.333 -78.667 -170.333 -118 -279 -118c-108.667 0 -202.333 39.333 -281 118c0 0 -70 -70 -70 -70m-140 -142c136 -137.333 299.667 -206 491 -206c191.333 0 354.333 68.667 489 206c0 0 -70 70 -70 70c-116 -117.333 -256 -176 -420 -176c-164 0 -304 58.667 -420 176c0 0 -70 -70 -70 -70" />
          </svg>
          <div class="absolute -top-0.5 -right-0.5 w-2 h-2 bg-green-500 rounded-full" />
        </template>

        <!-- Connecting (yellow dot) -->
        <template v-else-if="connectionState === EmlConnectionState.CONNECTING">
          <svg class="w-5 h-5 rotate-180"
               xmlns="http://www.w3.org/2000/svg"
               viewBox="0 0 980 1000"
               fill="white">
            <path d="M490 700c28 0 51.667 10 71 30c19.333 20 29 43.333 29 70c0 28 -9.667 51.667 -29 71c-19.333 19.333 -43 29 -71 29c-26.667 0 -49.667 -9.667 -69 -29c-19.333 -19.333 -29 -43 -29 -71c0 -26.667 9.667 -50 29 -70c19.333 -20 42.333 -30 69 -30c0 0 0 0 0 0m-210 -112c58.667 -58.667 128.667 -88 210 -88c81.333 0 151.333 29.333 210 88c0 0 -70 72 -70 72c-38.667 -38.667 -85.333 -58 -140 -58c-54.667 0 -101.333 19.333 -140 58c0 0 -70 -72 -70 -72m-140 -140c97.333 -98.667 214.333 -148 351 -148c136.667 0 253 49.333 349 148c0 0 -70 70 -70 70c-77.333 -78.667 -170.333 -118 -279 -118c-108.667 0 -202.333 39.333 -281 118c0 0 -70 -70 -70 -70m-140 -142c136 -137.333 299.667 -206 491 -206c191.333 0 354.333 68.667 489 206c0 0 -70 70 -70 70c-116 -117.333 -256 -176 -420 -176c-164 0 -304 58.667 -420 176c0 0 -70 -70 -70 -70" />
          </svg>
          <div class="absolute -top-0.5 -right-0.5 w-2 h-2 bg-yellow-500 rounded-full" />
        </template>

        <!-- Disconnected (red bar) -->
        <template v-else>
          <svg class="w-5 h-5 rotate-180"
               xmlns="http://www.w3.org/2000/svg"
               viewBox="0 0 980 1000"
               fill="white">
            <g class="animate-flashy-opacity">
              <path d="M490 700c28 0 51.667 10 71 30c19.333 20 29 43.333 29 70c0 28 -9.667 51.667 -29 71c-19.333 19.333 -43 29 -71 29c-26.667 0 -49.667 -9.667 -69 -29c-19.333 -19.333 -29 -43 -29 -71c0 -26.667 9.667 -50 29 -70c19.333 -20 42.333 -30 69 -30c0 0 0 0 0 0m-210 -112c58.667 -58.667 128.667 -88 210 -88c81.333 0 151.333 29.333 210 88c0 0 -70 72 -70 72c-38.667 -38.667 -85.333 -58 -140 -58c-54.667 0 -101.333 19.333 -140 58c0 0 -70 -72 -70 -72m-140 -140c97.333 -98.667 214.333 -148 351 -148c136.667 0 253 49.333 349 148c0 0 -70 70 -70 70c-77.333 -78.667 -170.333 -118 -279 -118c-108.667 0 -202.333 39.333 -281 118c0 0 -70 -70 -70 -70m-140 -142c136 -137.333 299.667 -206 491 -206c191.333 0 354.333 68.667 489 206c0 0 -70 70 -70 70c-116 -117.333 -256 -176 -420 -176c-164 0 -304 58.667 -420 176c0 0 -70 -70 -70 -70" />
            </g>
            <line x1="100"
                  y1="900"
                  x2="880"
                  y2="100"
                  stroke="var(--color-background)"
                  stroke-width="160"
                  stroke-linecap="round" />
            <line x1="100"
                  y1="900"
                  x2="880"
                  y2="100"
                  stroke="red"
                  stroke-width="80"
                  stroke-linecap="round" />
          </svg>
        </template>
      </div>
    </template>

    <template #content>
      <div class="p-3 w-56">
        <div class="flex flex-col">
          <template v-if="isEmlDisabled">
            <span class="font-medium text-gray-400">{{ $t('common.disabled') }}</span>
          </template>
          <template v-else-if="connectionState === EmlConnectionState.CONNECTED">
            <div class="flex flex-col mb-2">
              <span class="text-[10px] text-gray-500 uppercase">{{ $t('gps.device') }}</span>
              <span class="text-sm text-white font-medium">{{ connectedDevice?.name }}</span>
            </div>
            <div class="flex flex-col">
              <span class="text-[10px] text-gray-500 uppercase">
                {{ $t('eml.last_received') }}
                <span v-if="lastReceivedTime" class="text-gray-600 ml-1">({{ lastReceivedTime }})</span>
              </span>
              <span class="font-mono text-xs text-white break-all">{{ lastReceivedLine || '-' }}</span>
            </div>
          </template>
          <template v-else-if="connectionState === EmlConnectionState.CONNECTING">
            <span class="font-medium text-gray-400">{{ $t('common.reconnecting') }}...</span>
          </template>
          <template v-else>
            <span class="font-medium text-gray-400">{{ $t('common.not_connected') }}</span>
          </template>
        </div>
      </div>
    </template>
  </IndicatorWrapper>
</template>

<script setup lang="ts">
  import { ref, computed, onMounted, onUnmounted } from 'vue';
  import { useEmlService } from '@/services/eml/useEmlService';
  import { useUserSettingsStore } from '@/common/stores/useUserSettingsStore';
  import { EmlConnectionState } from '@/services/eml/types/EmlConnectionState.enum';
  import { EmlConnectionType } from '@/services/eml/types/EmlConnectionType.enum';
  import IndicatorWrapper from './IndicatorWrapper.vue';

  const { connectionState, connectedDevice, subscribeToData } = useEmlService();
  const userSettingsStore = useUserSettingsStore();

  const isEmlDisabled = computed(() => userSettingsStore.emlConnectionType === EmlConnectionType.DISABLED);

  const lastReceivedLine = ref<string>('');
  const lastReceivedTime = ref<string>('');

  let unsubscribe: (() => void) | null = null;

  const handleEmlData = (data: string) =>
  {
    console.log('📊 EML Indicator: Received data:', data.substring(0, 50));
    lastReceivedLine.value = data;
    lastReceivedTime.value = new Date().toLocaleTimeString();
  };

  onMounted(() =>
  {
    unsubscribe = subscribeToData(handleEmlData);
  });

  onUnmounted(() =>
  {
    if (unsubscribe)
    {
      unsubscribe();
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
