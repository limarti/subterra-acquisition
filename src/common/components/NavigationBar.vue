<template>
  <div class="flex items-center justify-between border-t border-b border-border-gray">
    <div class="flex items-center min-w-0">
      <div v-if="showBackButton" class="flex items-center shrink-0 h-full">
        <button class="p-2 cursor-pointer text-gray-200 hover:text-white transition-colors border-r border-border-gray"
                @click="emit('back')">
          <svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M15 18L9 12L15 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
          </svg>
        </button>
      </div>

      <img :src="currentLogo"
           alt="Logo"
           class="h-8 select-none mx-3 cursor-pointer"
           @touchstart="handlePressStart"
           @touchend="handlePressEnd"
           @touchcancel="handlePressEnd"
           @mousedown="handlePressStart"
           @mouseup="handlePressEnd"
           @mouseleave="handlePressEnd">

      <div v-if="$slots.left" class="flex items-center h-full">
        <slot name="left" />
      </div>
    </div>

    <div class="flex items-center justify-end min-w-0">
      <div class="flex flex-wrap justify-end items-center min-w-0">
        <div v-if="shouldShowEmlIndicator">
          <EmlConnectionIndicator />
        </div>
        <div v-if="shouldShowGpsIndicator">
          <GpsConnectionIndicator />
        </div>
        <div v-if="$slots.rightIndicators">
          <slot name="rightIndicators" />
        </div>

        <div v-if="$slots.right" class="flex items-center shrink-0">
          <slot name="right" />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { computed, ref, inject, onUnmounted, type Ref } from 'vue';
  import { useRoute } from 'vue-router';
  import { Haptics, ImpactStyle } from '@capacitor/haptics';
  import { getFeatureFlags } from '@/common/utils/featureFlags';
  import GpsConnectionIndicator from './status-indicators/GpsConnectionIndicator.vue';
  import EmlConnectionIndicator from './status-indicators/EmlConnectionIndicator.vue';
  import logoFull from '@/assets/images/logo.svg';
  import logoShort from '@/assets/images/logo-short.svg';

  interface Props
  {
    showBackButton?: boolean;
  }

  interface Emits
  {
    back: [];
  }

  withDefaults(defineProps<Props>(), {
    showBackButton: false
  });

  const emit = defineEmits<Emits>();
  const route = useRoute();

  // Debug console activation via long press
  const isDebugConsoleActivated = inject<Ref<boolean>>('isDebugConsoleActivated');
  const featureFlags = getFeatureFlags();
  const longPressTimer = ref<number | null>(null);
  const LONG_PRESS_DURATION = 8000;

  const handlePressStart = (event: TouchEvent | MouseEvent) =>
  {
    if (!featureFlags.enableDebugConsole)
    {
      return;
    }

    event.preventDefault();

    longPressTimer.value = window.setTimeout(async () =>
    {
      if (isDebugConsoleActivated)
      {
        isDebugConsoleActivated.value = true;
        try
        {
          await Haptics.impact({ style: ImpactStyle.Heavy });
        }
        catch (error)
        {
          console.debug('Haptic feedback not available:', error);
        }
      }
    }, LONG_PRESS_DURATION);
  };

  const handlePressEnd = () =>
  {
    if (longPressTimer.value !== null)
    {
      clearTimeout(longPressTimer.value);
      longPressTimer.value = null;
    }
  };

  // Cleanup timer on unmount
  onUnmounted(() =>
  {
    if (longPressTimer.value !== null)
    {
      clearTimeout(longPressTimer.value);
    }
  });

  const currentLogo = computed(() =>
  {
    const routeName = route.name as string;
    const useFullLogo = routeName === 'settings' || routeName === 'dashboard';
    return useFullLogo ? logoFull : logoShort;
  });

  const shouldShowGpsIndicator = computed(() =>
  {
    const routeName = route.name as string;
    return routeName === 'settings' ||
           routeName === 'dashboard' ||
           routeName.startsWith('project');
  });

  const shouldShowEmlIndicator = computed(() =>
  {
    const routeName = route.name as string;
    return routeName === 'settings' ||
           routeName === 'dashboard' ||
           routeName.startsWith('project');
  });
</script>
