<template>
  <div v-if="isActivated" class="fixed bottom-0 left-0 right-0 z-[9999] pointer-events-none">
    <!-- Toggle Button (visible only when console is activated) -->
    <button v-if="!isOpen"
            class="absolute bottom-4 right-4 pointer-events-auto bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white rounded-full w-14 h-14 flex items-center justify-center shadow-lg transition-all"
            @click="isOpen = true">
      <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    </button>

    <!-- Console Panel (slides up) -->
    <Transition enterActiveClass="transition-transform duration-300 ease-out"
                enterFromClass="translate-y-full"
                enterToClass="translate-y-0"
                leaveActiveClass="transition-transform duration-300 ease-in"
                leaveFromClass="translate-y-0"
                leaveToClass="translate-y-full">
      <div v-if="isOpen"
           class="pointer-events-auto bg-gray-900 border-t-2 border-gray-700 shadow-2xl"
           :style="{ height: panelHeight + 'px' }">
        <!-- Header -->
        <div class="flex items-center justify-between bg-gray-800 px-4 py-2 border-b border-gray-700">
          <div class="flex items-center gap-2">
            <svg class="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <h3 class="text-white font-semibold text-sm">
              Debug Console
            </h3>
            <span class="text-xs text-gray-400">
              ({{ filteredLogs.length }} logs)
            </span>
          </div>

          <div class="flex items-center justify-center gap-2 flex-wrap">
            <!-- Filter buttons -->
            <button :class="[
                      'px-2 py-1 rounded text-xs font-medium transition-all',
                      logFilter === 'all' ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    ]"
                    @click="logFilter = 'all'">
              ALL
            </button>
            <button :class="[
                      'px-2 py-1 rounded text-xs font-medium transition-all',
                      logFilter === 'web' ? 'bg-green-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    ]"
                    @click="logFilter = 'web'">
              WEB
            </button>
            <button :class="[
                      'px-2 py-1 rounded text-xs font-medium transition-all',
                      logFilter === 'native' ? 'bg-purple-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    ]"
                    @click="logFilter = 'native'">
              NATIVE
            </button>

            <!-- Clear button -->
            <button class="px-2 py-1 rounded text-xs font-medium bg-red-600 hover:bg-red-700 text-white transition-all"
                    @click="clearLogs">
              CLEAR
            </button>

            <!-- Resize handle (drag to resize) -->
            <div class="w-px h-4 bg-gray-600" />
            <button class="px-2 py-1 text-gray-400 hover:text-white transition-all"
                    @mousedown="startResize"
                    @touchstart="startResize">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 8h16M4 16h16" />
              </svg>
            </button>

            <!-- Close button -->
            <button class="px-2 py-1 text-gray-400 hover:text-white transition-all"
                    @click="isOpen = false">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <!-- Logs Container -->
        <div ref="logsContainer"
             class="overflow-y-auto px-4 py-2 font-mono text-xs"
             :style="{ height: (panelHeight - 45) + 'px' }">
          <div v-if="filteredLogs.length === 0" class="text-gray-500 text-center py-8">
            No logs yet...
          </div>

          <div v-for="(log, index) in filteredLogs"
               :key="index"
               class="mb-1 pb-1 border-b border-gray-800 last:border-0">
            <div class="flex items-start gap-2">
              <span class="text-gray-600 shrink-0 text-[10px]">
                {{ log.time }}
              </span>
              <span :class="getLogLevelClass(log.level)"
                    class="px-1.5 py-0.5 rounded text-[9px] font-bold shrink-0">
                {{ log.level.toUpperCase() }}
              </span>
              <span v-if="log.source === 'plugin'"
                    class="px-1.5 py-0.5 rounded text-[9px] font-bold shrink-0 bg-purple-700 text-purple-100">
                NATIVE
              </span>
              <span class="text-gray-200 break-all leading-relaxed">
                {{ log.message }}
              </span>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
  import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue';

  interface Props
  {
    isActivated: boolean;
  }

  const props = defineProps<Props>();

  interface ConsoleLog
  {
    time: string;
    level: string;
    message: string;
    source: 'web' | 'plugin';
  }

  const isOpen = ref(false);
  const panelHeight = ref(300);
  const consoleLogs = ref<ConsoleLog[]>([]);
  const logsContainer = ref<HTMLElement | null>(null);
  const logFilter = ref<'all' | 'web' | 'native'>('all');
  const MAX_LOGS = 200;

  const isResizing = ref(false);
  const resizeStartY = ref(0);
  const resizeStartHeight = ref(0);

  // Store original console methods
  const originalConsole = {
    log: console.log.bind(console),
    info: console.info.bind(console),
    warn: console.warn.bind(console),
    error: console.error.bind(console),
    debug: console.debug.bind(console),
  };

  const filteredLogs = computed(() =>
  {
    if (logFilter.value === 'all') return consoleLogs.value;
    if (logFilter.value === 'web') return consoleLogs.value.filter(log => log.source === 'web');
    if (logFilter.value === 'native') return consoleLogs.value.filter(log => log.source === 'plugin');
    return consoleLogs.value;
  });

  const addLog = (message: string, level: string, source: 'web' | 'plugin' = 'web') =>
  {
    const time = new Date().toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
    consoleLogs.value.push({ time, level, message, source });

    // Keep only last MAX_LOGS entries
    if (consoleLogs.value.length > MAX_LOGS)
    {
      consoleLogs.value.shift();
    }

    // Auto-scroll to bottom
    nextTick(() =>
    {
      if (logsContainer.value)
      {
        logsContainer.value.scrollTop = logsContainer.value.scrollHeight;
      }
    });
  };

  const clearLogs = () =>
  {
    consoleLogs.value = [];
  };

  const getLogLevelClass = (level: string) =>
  {
    const classes = {
      'info': 'bg-blue-700 text-blue-100',
      'success': 'bg-green-700 text-green-100',
      'warn': 'bg-yellow-600 text-yellow-100',
      'error': 'bg-red-700 text-red-100',
      'debug': 'bg-purple-700 text-purple-100',
      'log': 'bg-gray-600 text-gray-100'
    };
    return classes[level as keyof typeof classes] || classes.log;
  };

  // Resize functionality (supports both mouse and touch)
  const startResize = (event: MouseEvent | TouchEvent) =>
  {
    event.preventDefault();
    isResizing.value = true;

    // Get Y position from either mouse or touch event
    const clientY = event instanceof MouseEvent ? event.clientY : event.touches[0]?.clientY;
    if (clientY === undefined) return;

    resizeStartY.value = clientY;
    resizeStartHeight.value = panelHeight.value;

    // Add both mouse and touch event listeners
    document.addEventListener('mousemove', handleResize);
    document.addEventListener('mouseup', stopResize);
    document.addEventListener('touchmove', handleResize);
    document.addEventListener('touchend', stopResize);
    document.body.style.userSelect = 'none';
  };

  const handleResize = (event: MouseEvent | TouchEvent) =>
  {
    if (!isResizing.value) return;

    // Get Y position from either mouse or touch event
    const clientY = event instanceof MouseEvent ? event.clientY : event.touches[0]?.clientY;
    if (clientY === undefined) return;

    const deltaY = resizeStartY.value - clientY;
    const newHeight = resizeStartHeight.value + deltaY;

    // Constrain height between 150px and 80% of viewport
    panelHeight.value = Math.max(150, Math.min(newHeight, window.innerHeight * 0.8));
  };

  const stopResize = () =>
  {
    isResizing.value = false;
    document.removeEventListener('mousemove', handleResize);
    document.removeEventListener('mouseup', stopResize);
    document.removeEventListener('touchmove', handleResize);
    document.removeEventListener('touchend', stopResize);
    document.body.style.userSelect = '';
  };

  // Intercept console methods
  const setupConsoleIntercept = () =>
  {
    console.log = function(...args: unknown[])
    {
      originalConsole.log(...args);
      addLog(args.map(String).join(' '), 'log', 'web');
    };

    console.info = function(...args: unknown[])
    {
      originalConsole.info(...args);
      addLog(args.map(String).join(' '), 'info', 'web');
    };

    console.warn = function(...args: unknown[])
    {
      originalConsole.warn(...args);
      addLog(args.map(String).join(' '), 'warn', 'web');
    };

    console.error = function(...args: unknown[])
    {
      originalConsole.error(...args);
      addLog(args.map(String).join(' '), 'error', 'web');
    };

    console.debug = function(...args: unknown[])
    {
      originalConsole.debug(...args);
      addLog(args.map(String).join(' '), 'debug', 'web');
    };
  };

  // Restore original console methods
  const restoreConsole = () =>
  {
    console.log = originalConsole.log;
    console.info = originalConsole.info;
    console.warn = originalConsole.warn;
    console.error = originalConsole.error;
    console.debug = originalConsole.debug;
  };

  onMounted(() =>
  {
    setupConsoleIntercept();

    // Initial log
    console.info('Debug console initialized');
  });

  onUnmounted(() =>
  {
    restoreConsole();

    // Remove both mouse and touch event listeners
    document.removeEventListener('mousemove', handleResize);
    document.removeEventListener('mouseup', stopResize);
    document.removeEventListener('touchmove', handleResize);
    document.removeEventListener('touchend', stopResize);
  });

</script>
