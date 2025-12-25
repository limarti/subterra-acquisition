<template>
  <div class="px-3 flex flex-col w-full min-w-0">
    <span v-if="label" class="text-sm text-white font-medium">
      {{ label }}
    </span>
    <span v-if="content" class="text-[10px] text-text-secondary">
      {{ content }}
    </span>
  </div>
</template>

<script setup lang="ts">
  interface Props
  {
    label?: string;
    content: string;
  }

  defineProps<Props>();
</script>
