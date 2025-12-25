<template>
  <button type="button"
          class="w-11 h-11 flex items-center justify-center text-text-secondary cursor-pointer hover:text-white hover:bg-background transition-colors border border-border-card bg-background-darker rounded-t-lg"
          :title="title"
          @click="$emit('click')">
    <slot />
  </button>
</template>

<script setup lang="ts">
  interface Props
  {
    title?: string;
  }

  interface Emits
  {
    click: [];
  }

  defineProps<Props>();
  defineEmits<Emits>();
</script>
