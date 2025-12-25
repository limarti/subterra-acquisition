<template>
  <!-- Full screen in production, resizable frame in development -->
  <div v-if="!isDevelopment" class="w-full h-screen">
    <slot />
  </div>

  <!-- Development mode with resizable frame -->
  <div v-else class="relative w-full h-screen bg-gray-100 flex items-center justify-center overflow-hidden">
    <!-- Device frame (only when device is selected) -->
    <div v-if="selectedDevice"
         ref="containerRef"
         class="relative bg-white overflow-hidden shadow-2xl"
         :style="{
           width: effectiveDimensions.width + 'px',
           height: effectiveDimensions.height + 'px',
           borderRadius: selectedDevice.borderRadius + 'px',
           transform: `scale(${zoomLevel / 100})`,
           transformOrigin: 'center center'
         }">

      <!-- Status bar overlay (portrait) -->
      <div v-if="selectedDevice && orientation === 'portrait' && !featureFlags.hideStatusBar"
           class="absolute top-0 left-0 right-0 bg-background"
           :style="{
             height: selectedDevice.safeArea.top + 'px'
           }" />

      <!-- Status bar overlay (landscape) -->
      <div v-if="selectedDevice && orientation === 'landscape' && !featureFlags.hideStatusBar"
           class="absolute top-0 left-0 bottom-0 bg-background"
           :style="{
             width: selectedDevice.safeArea.top + 'px'
           }" />

      <!-- Dynamic Island / Notch overlay -->
      <div v-if="selectedDevice.notch && selectedDevice.notch.type !== 'none'"
           class="absolute bg-black"
           :class="{
             'rounded-full': selectedDevice.notch.type === 'punch-hole',
             'rounded-[20px]': selectedDevice.notch.type === 'dynamic-island' || selectedDevice.notch.type === 'pill',
             'rounded-b-[10px]': selectedDevice.notch.type === 'waterdrop'
           }"
           :style="orientation === 'portrait' ? {
             width: selectedDevice.notch.width + 'px',
             height: selectedDevice.notch.height + 'px',
             top: (selectedDevice.notch.topOffset ?? 0) + 'px',
             left: '50%',
             transform: 'translateX(-50%)'
           } : {
             width: selectedDevice.notch.height + 'px',
             height: selectedDevice.notch.width + 'px',
             left: (selectedDevice.notch.topOffset ?? 0) + 'px',
             top: '50%',
             transform: 'translateY(-50%)'
           }" />

      <!-- Content slot -->
      <div class="w-full h-full @container"
           :style="selectedDevice && !featureFlags.hideStatusBar ? (
             orientation === 'portrait'
               ? { paddingTop: selectedDevice.safeArea.top + 'px' }
               : { paddingLeft: selectedDevice.safeArea.top + 'px' }
           ) : {}">
        <slot />
      </div>

      <!-- Home indicator (iOS-style) -->
      <div v-if="selectedDevice.homeIndicator"
           class="absolute bg-white/30 rounded-full"
           :style="orientation === 'portrait' ? {
             width: selectedDevice.homeIndicator.width + 'px',
             height: selectedDevice.homeIndicator.height + 'px',
             bottom: selectedDevice.homeIndicator.bottomOffset + 'px',
             left: '50%',
             transform: 'translateX(-50%)'
           } : {
             width: selectedDevice.homeIndicator.width + 'px',
             height: selectedDevice.homeIndicator.height + 'px',
             bottom: selectedDevice.homeIndicator.bottomOffset + 'px',
             left: '50%',
             transform: 'translateX(-50%)'
           }" />
    </div>

    <!-- Custom resizable frame (when no device selected) -->
    <div v-else
         ref="containerRef"
         class="relative border-2 border-gray-400 bg-white shadow-lg"
         :style="{
           width: containerWidth + 'px',
           height: containerHeight + 'px'
         }">
      <!-- Resize handle - Bottom right only -->
      <div style="position: absolute; bottom: -8px; right: -8px; width: 16px; height: 16px; background: #6b7280; border: 1px solid #374151; cursor: se-resize; z-index: 1000; border-radius: 2px; display: flex; align-items: center; justify-content: center; color: white; font-size: 10px; line-height: 1;"
           @mousedown="startResize('se', $event)">
        ⤡
      </div>

      <!-- Content slot -->
      <div class="w-full h-full @container">
        <slot />
      </div>
    </div>

    <!-- Debug overlay -->
    <div class="fixed bottom-5 left-5 z-[9999] pointer-events-none">
      <div class="bg-background-darker border border-gray-600 rounded-lg p-4 w-[280px] font-mono text-xs text-white pointer-events-auto shadow-lg">
        <h3 class="m-0 mb-3 text-sm font-bold text-green-400 border-b border-gray-600 pb-2">
          Debug Panel
        </h3>

        <!-- Device simulation -->
        <div class="mb-3">
          <p class="my-1 text-gray-400">
            Device Simulation
          </p>

          <!-- Single-line controls: dropdown + orientation buttons -->
          <div class="flex gap-1 items-center">
            <!-- Device selector -->
            <select v-model="selectedDeviceId"
                    class="flex-1 min-w-0 bg-gray-800 border border-gray-700 text-white px-2 py-1 rounded text-[11px]">
              <option value="custom">
                Custom (Resizable)
              </option>
              <optgroup label="Phones">
                <option v-for="device in DEVICE_PRESETS.filter((d: { category: string; }) => d.category === 'phone')"
                        :key="device.id"
                        :value="device.id">
                  {{ device.name }}
                </option>
              </optgroup>
              <optgroup label="Tablets">
                <option v-for="device in DEVICE_PRESETS.filter((d: { category: string; }) => d.category === 'tablet')"
                        :key="device.id"
                        :value="device.id">
                  {{ device.name }}
                </option>
              </optgroup>
            </select>

            <!-- Orientation buttons (shown only when device is selected) -->
            <button v-if="selectedDevice"
                    :class="[
                      'border text-white w-7 h-7 rounded cursor-pointer transition-all duration-200 flex-shrink-0 flex items-center justify-center',
                      orientation === 'portrait'
                        ? 'bg-indigo-700 border-indigo-600 hover:bg-indigo-600 active:bg-indigo-500'
                        : 'bg-gray-700 border-gray-600 hover:bg-gray-600 active:bg-gray-500'
                    ]"
                    @click="orientation = 'portrait'">
              <svg width="8" height="12" viewBox="0 0 8 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect x="0.5" y="0.5" width="7" height="11" rx="0.5" stroke="currentColor" stroke-width="1" />
              </svg>
            </button>
            <button v-if="selectedDevice"
                    :class="[
                      'border text-white w-7 h-7 rounded cursor-pointer transition-all duration-200 flex-shrink-0 flex items-center justify-center',
                      orientation === 'landscape'
                        ? 'bg-indigo-700 border-indigo-600 hover:bg-indigo-600 active:bg-indigo-500'
                        : 'bg-gray-700 border-gray-600 hover:bg-gray-600 active:bg-gray-500'
                    ]"
                    @click="orientation = 'landscape'">
              <svg width="12" height="8" viewBox="0 0 12 8" fill="none" xmlns="http://www.w3.org/2000/svg" style="margin-top: 2px;">
                <rect x="0.5" y="0.5" width="11" height="7" rx="0.5" stroke="currentColor" stroke-width="1" />
              </svg>
            </button>
          </div>
        </div>

        <!-- Router debugging -->
        <div class="mb-3">
          <p class="my-1 text-gray-400">
            Router
          </p>

          <!-- Unified path input with navigation buttons -->
          <div class="flex gap-1 items-center">
            <!-- Navigation buttons -->
            <button class="bg-blue-700 border border-blue-600 text-white px-2 py-1 rounded text-[11px] cursor-pointer transition-all duration-200 hover:bg-blue-600 active:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                    :disabled="!canGoBack"
                    @click="goBack">
              ←
            </button>
            <button v-if="canGoForward"
                    class="bg-blue-700 border border-blue-600 text-white px-2 py-1 rounded text-[11px] cursor-pointer transition-all duration-200 hover:bg-blue-600 active:bg-blue-500"
                    @click="goForward">
              →
            </button>

            <!-- Unified path input -->
            <input v-model="pathInput"
                   class="flex-1 bg-gray-800 border border-gray-700 text-green-400 px-2 py-1 rounded text-[10px] font-mono"
                   @keyup.enter="navigateToPath"
                   @focus="onPathInputFocus"
                   @blur="onPathInputBlur">

            <!-- GO button -->
            <button class="bg-purple-700 border border-purple-600 text-white px-2 py-1 rounded text-[11px] cursor-pointer transition-all duration-200 hover:bg-purple-600 active:bg-purple-500"
                    @click="navigateToPath">
              GO
            </button>
          </div>
        </div>

      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { computed, ref, onMounted, onUnmounted, watch } from 'vue';
  import { useRouter, useRoute } from 'vue-router';
  import { getAppMode } from '@/common/utils/appMode';
  import { getFeatureFlags } from '@/common/utils/featureFlags';

  // Device profile types
  type NotchType = 'pill' | 'dynamic-island' | 'waterdrop' | 'punch-hole' | 'none';
  type DeviceCategory = 'phone' | 'tablet';

  interface DeviceProfile
  {
    id: string;
    name: string;
    category: DeviceCategory;
    dimensions: {
      width: number;
      height: number;
    };
    pixelRatio: number;
    safeArea: {
      top: number;
      bottom: number;
      left: number;
      right: number;
    };
    borderRadius: number;
    notch?: {
      type: NotchType;
      width: number;
      height: number;
      topOffset?: number;
    };
    homeIndicator?: {
      width: number;
      height: number;
      bottomOffset: number;
    };
  }

  // Device presets
  const DEVICE_PRESETS: DeviceProfile[] = [
    {
      id: 'iphone-15-pro',
      name: 'iPhone 15 Pro',
      category: 'phone',
      dimensions: { width: 393, height: 852 },
      pixelRatio: 3,
      safeArea: { top: 59, bottom: 34, left: 0, right: 0 },
      borderRadius: 55,
      notch: {
        type: 'dynamic-island',
        width: 126,
        height: 37,
        topOffset: 11
      },
      homeIndicator: {
        width: 134,
        height: 5,
        bottomOffset: 8
      }
    },
    {
      id: 'iphone-15-pro-max',
      name: 'iPhone 15 Pro Max',
      category: 'phone',
      dimensions: { width: 430, height: 932 },
      pixelRatio: 3,
      safeArea: { top: 59, bottom: 34, left: 0, right: 0 },
      borderRadius: 55,
      notch: {
        type: 'dynamic-island',
        width: 126,
        height: 37,
        topOffset: 11
      },
      homeIndicator: {
        width: 134,
        height: 5,
        bottomOffset: 8
      }
    },
    {
      id: 'iphone-se',
      name: 'iPhone SE',
      category: 'phone',
      dimensions: { width: 375, height: 667 },
      pixelRatio: 2,
      safeArea: { top: 20, bottom: 0, left: 0, right: 0 },
      borderRadius: 0,
      notch: {
        type: 'none',
        width: 0,
        height: 0
      }
    },
    {
      id: 'samsung-s25-ultra',
      name: 'Samsung Galaxy S25 Ultra',
      category: 'phone',
      dimensions: { width: 384, height: 832 },
      pixelRatio: 3.75,
      safeArea: { top: 40, bottom: 24, left: 0, right: 0 },
      borderRadius: 32,
      notch: {
        type: 'punch-hole',
        width: 20,
        height: 20,
        topOffset: 16
      }
    },
    {
      id: 'pixel-9-pro',
      name: 'Google Pixel 9 Pro',
      category: 'phone',
      dimensions: { width: 427, height: 952 },
      pixelRatio: 3,
      safeArea: { top: 44, bottom: 28, left: 0, right: 0 },
      borderRadius: 36,
      notch: {
        type: 'punch-hole',
        width: 18,
        height: 18,
        topOffset: 18
      }
    },
    {
      id: 'ipad-pro-11',
      name: 'iPad Pro 11"',
      category: 'tablet',
      dimensions: { width: 834, height: 1194 },
      pixelRatio: 2,
      safeArea: { top: 24, bottom: 20, left: 0, right: 0 },
      borderRadius: 18,
      notch: {
        type: 'none',
        width: 0,
        height: 0
      }
    },
    {
      id: 'ipad-pro-13',
      name: 'iPad Pro 13"',
      category: 'tablet',
      dimensions: { width: 1032, height: 1376 },
      pixelRatio: 2,
      safeArea: { top: 24, bottom: 20, left: 0, right: 0 },
      borderRadius: 18,
      notch: {
        type: 'none',
        width: 0,
        height: 0
      }
    }
  ];

  const getDeviceById = (id: string): DeviceProfile | undefined =>
  {
    return DEVICE_PRESETS.find(device => device.id === id);
  };

  // Resize state
  const containerRef = ref<HTMLElement | null>(null);
  const containerWidth = ref(800);
  const containerHeight = ref(600);
  const isResizing = ref(false);
  const resizeDirection = ref('');
  const startX = ref(0);
  const startY = ref(0);
  const startWidth = ref(0);
  const startHeight = ref(0);

  // Device simulation state
  const selectedDeviceId = ref<string>('samsung-s25-ultra');
  const orientation = ref<'portrait' | 'landscape'>('portrait');

  const mode = getAppMode();
  const isDevelopment = mode === 'debug' || mode === 'web-preview';

  // Router functionality
  const router = useRouter();
  const currentRoute = useRoute();
  const pathInput = ref('');
  const isEditingPath = ref(false);

  // Navigation history tracking
  const navigationHistory = ref<string[]>([]);
  const currentHistoryIndex = ref(-1);

  const featureFlags = getFeatureFlags();

  // Device simulation computed
  const selectedDevice = computed<DeviceProfile | null>(() =>
  {
    if (selectedDeviceId.value === 'custom') return null;
    return getDeviceById(selectedDeviceId.value) ?? null;
  });

  const effectiveDimensions = computed(() =>
  {
    if (!selectedDevice.value)
    {
      return {
        width: containerWidth.value,
        height: containerHeight.value
      };
    }

    const device = selectedDevice.value;
    if (orientation.value === 'landscape')
    {
      return {
        width: device.dimensions.height,
        height: device.dimensions.width
      };
    }
    return {
      width: device.dimensions.width,
      height: device.dimensions.height
    };
  });

  // Auto-fit zoom level (only for device presets, 100% for custom)
  const zoomLevel = computed(() =>
  {
    if (!selectedDevice.value) return 100;

    const dims = effectiveDimensions.value;
    const viewportWidth = window.innerWidth - 100;
    const viewportHeight = window.innerHeight - 100;

    const scaleWidth = (viewportWidth / dims.width) * 100;
    const scaleHeight = (viewportHeight / dims.height) * 100;

    const optimalZoom = Math.min(scaleWidth, scaleHeight, 100);
    return Math.floor(optimalZoom);
  });

  // Router navigation helpers
  const canGoBack = computed(() => currentHistoryIndex.value > 0);
  const canGoForward = computed(() => currentHistoryIndex.value < navigationHistory.value.length - 1);

  // Initialize navigation history
  const initializeHistory = () =>
  {
    navigationHistory.value = [currentRoute.path];
    currentHistoryIndex.value = 0;
  };

  // Track route changes
  const addToHistory = (path: string) =>
  {
    // Remove any forward history when navigating to a new path
    navigationHistory.value = navigationHistory.value.slice(0, currentHistoryIndex.value + 1);
    navigationHistory.value.push(path);
    currentHistoryIndex.value = navigationHistory.value.length - 1;
  };

  // Router navigation functions
  const goBack = () =>
  {
    if (canGoBack.value)
    {
      currentHistoryIndex.value--;
      const targetPath = navigationHistory.value[currentHistoryIndex.value];
      if (!targetPath)
      {
        throw new Error(`Navigation history at index ${currentHistoryIndex.value} is undefined`);
      }
      router.push(targetPath);
    }
  };

  const goForward = () =>
  {
    if (canGoForward.value)
    {
      currentHistoryIndex.value++;
      const targetPath = navigationHistory.value[currentHistoryIndex.value];
      if (!targetPath)
      {
        throw new Error(`Navigation history at index ${currentHistoryIndex.value} is undefined`);
      }
      router.push(targetPath);
    }
  };

  const navigateToPath = () =>
  {
    if (pathInput.value.trim() && pathInput.value.trim() !== currentRoute.path)
    {
      router.push(pathInput.value.trim());
    }
    isEditingPath.value = false;
  };

  const onPathInputFocus = () =>
  {
    isEditingPath.value = true;
  };

  const onPathInputBlur = () =>
  {
    // Reset to current path if not navigating
    setTimeout(() =>
    {
      if (!isEditingPath.value)
      {
        pathInput.value = currentRoute.path;
      }
    }, 100);
    isEditingPath.value = false;
  };

  // Resize functionality
  const startResize = (direction: string, event: MouseEvent) =>
  {
    event.preventDefault();
    event.stopPropagation();
    isResizing.value = true;
    resizeDirection.value = direction;
    startX.value = event.clientX;
    startY.value = event.clientY;
    startWidth.value = containerWidth.value;
    startHeight.value = containerHeight.value;

    document.addEventListener('mousemove', handleResize);
    document.addEventListener('mouseup', stopResize);

    // Add user-select: none to prevent text selection during resize
    document.body.style.userSelect = 'none';
  };

  const handleResize = (event: MouseEvent) =>
  {
    if (!isResizing.value) return;

    const deltaX = event.clientX - startX.value;
    const deltaY = event.clientY - startY.value;

    // Since the container is centered, we need to double the delta
    // because the container expands equally in all directions from center
    const newWidth = Math.max(300, startWidth.value + deltaX * 2);
    const newHeight = Math.max(200, startHeight.value + deltaY * 2);

    // Limit maximum size to prevent overflow
    const maxWidth = window.innerWidth - 100;
    const maxHeight = window.innerHeight - 100;

    containerWidth.value = Math.min(newWidth, maxWidth);
    containerHeight.value = Math.min(newHeight, maxHeight);
  };

  const stopResize = () =>
  {
    isResizing.value = false;
    resizeDirection.value = '';
    document.removeEventListener('mousemove', handleResize);
    document.removeEventListener('mouseup', stopResize);

    // Restore user selection
    document.body.style.userSelect = '';
  };

  // Initialize history on mount
  onMounted(() =>
  {
    initializeHistory();
    pathInput.value = currentRoute.path;
  });

  // Watch for route changes to update history and input
  watch(() => currentRoute.path, (newPath, oldPath) =>
  {
    if (newPath !== oldPath && navigationHistory.value[currentHistoryIndex.value] !== newPath)
    {
      addToHistory(newPath);
    }

    // Update input if not currently editing
    if (!isEditingPath.value)
    {
      pathInput.value = newPath;
    }
  });

  // Watch for device selection changes to update container dimensions
  watch(selectedDeviceId, (newId) =>
  {
    if (newId !== 'custom')
    {
      const device = getDeviceById(newId);
      if (device)
      {
        if (orientation.value === 'portrait')
        {
          containerWidth.value = device.dimensions.width;
          containerHeight.value = device.dimensions.height;
        }
        else
        {
          containerWidth.value = device.dimensions.height;
          containerHeight.value = device.dimensions.width;
        }
      }
    }
  });

  // Watch for orientation changes to swap dimensions
  watch(orientation, () =>
  {
    if (selectedDeviceId.value !== 'custom')
    {
      const temp = containerWidth.value;
      containerWidth.value = containerHeight.value;
      containerHeight.value = temp;
    }
  });

  // Cleanup on unmount
  onUnmounted(() =>
  {
    document.removeEventListener('mousemove', handleResize);
    document.removeEventListener('mouseup', stopResize);
  });

</script>

<style scoped>
/* No additional styles needed - using Tailwind classes */
</style>
