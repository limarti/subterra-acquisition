<template>
  <div class="absolute bottom-0 left-0 right-0 flex justify-center gap-4 p-4 pointer-events-none">
    <button
      type="button"
      class="pointer-events-auto flex items-center gap-2 px-4 py-2 bg-background-darker border border-border-gray rounded-lg text-text-secondary hover:text-white hover:bg-background transition-colors cursor-pointer"
      title="Add Object"
      @click="$emit('add-click')"
    >
      <svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 5V19M5 12H19" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
      <span>Add</span>
    </button>
  </div>
</template>

<script setup lang="ts">
  interface Emits
  {
    'add-click': [];
  }

  defineEmits<Emits>();
</script>

<style scoped>
  @reference "tailwindcss";
</style>
