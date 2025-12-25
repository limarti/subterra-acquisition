<template>
  <div class="relative w-7 h-4 border-2 border-white">
    <div class="h-full w-full px-0.5 flex items-center">
      <div class="h-2 transition-all duration-300"
           :class="batteryColor"
           :style="{ width: `${clampedLevel}%` }" />
    </div>
    <div class="absolute -right-1 top-1/2 -translate-y-1/2 w-0.5 h-2 bg-white" />
  </div>
</template>

<script lang="ts" setup>
  import { computed } from 'vue';

  const props = defineProps<{
    level: number;
  }>();

  const clampedLevel = computed(() =>
    Math.min(100, Math.max(0, props.level))
  );

  const batteryColor = computed(() =>
  {
    if (clampedLevel.value <= 20) return 'bg-red-500';
    if (clampedLevel.value <= 50) return 'bg-yellow-400';
    return 'bg-green-500';
  });
</script>
