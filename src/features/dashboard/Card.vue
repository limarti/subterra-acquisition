<template>
  <div class="flex flex-col rounded-md border border-border-card overflow-hidden bg-background-darker">
    <div class="flex items-center justify-between h-15 w-full bg-background-lighter rounded-t-sm p-4 border-b-1 border-border-card">
      <span class="text-white text-xl font-semibold">{{ title }}</span>
      <slot name="headerRight" />
    </div>
    <div class="transition-all duration-300">
      <slot />
    </div>
  </div>
</template>

<script setup lang="ts">

  interface Props
  {
    title: string;
  }

  defineProps<Props>();

</script>
