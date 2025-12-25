<template>
  <div class="h-full flex items-center justify-center">
    <p class="text-text-secondary">
      {{ $t('common.coming_soon') }}
    </p>
  </div>
</template>

<script setup lang="ts">
  import { useProjectContext } from './useProjectContext';

  const { project } = useProjectContext();
</script>
