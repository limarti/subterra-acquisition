<template>
  <div class="dialog-overlay overflow-hidden absolute inset-0 backdrop-blur-xs bg-black/50 flex items-end justify-center transition-opacity duration-200 ease-out dialog-fade" @click="handleOverlayClick" @keydown.escape="handleClose">
    <div class="bg-background-lighter dialog-slide border-t-1 border-x-1 mx-4 border-border-gray rounded-t-md max-h-[calc(100%-1rem)] shadow-[0_-8px_48px_0_rgba(0,0,0,0.5)] w-100 flex flex-col" @click.stop>

      <!-- header -->
      <div class="flex justify-start items-center p-4 border-b-1 shrink-0">
        <div class="flex items-center">
          <slot name="icon" />
        </div>

        <div class="ml-4 flex items-center">
          <h3 class="text-xl text-white/80 font-semibold">
            <slot name="title" />
          </h3>
        </div>
      </div>

      <!-- content -->
      <OverlayScrollbarsComponent class="flex-1 bg-background-darker">
        <div>
          <slot name="content" />
        </div>
      </OverlayScrollbarsComponent>

      <div class="flex justify-center my-5 shrink-0">
        <button v-if="showCloseButton" class="cursor-pointer rounded-full px-2.5 py-0.5 text-white text-xl bg-background-lighter-lighter" @click="handleClose">
          <svg class="w-6 h-10" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path fill-rule="evenodd" clip-rule="evenodd" d="M18.6454 5.29112C19.0369 5.68067 19.0384 6.31383 18.6489 6.70533L13.4107 11.9699L18.7089 17.2947C19.0984 17.6862 19.0968 18.3193 18.7053 18.7089C18.3138 19.0984 17.6807 19.0968 17.2911 18.7053L12 13.3876L6.70888 18.7053C6.31933 19.0968 5.68617 19.0984 5.29467 18.7089C4.90317 18.3193 4.90158 17.6862 5.29112 17.2947L10.5893 11.9699L5.3511 6.70534C4.96156 6.31384 4.96314 5.68067 5.35465 5.29113C5.74615 4.90158 6.37931 4.90317 6.76886 5.29467L12 10.5521L17.2311 5.29467C17.6207 4.90317 18.2539 4.90158 18.6454 5.29112Z" fill="white" />
          </svg>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { OverlayScrollbarsComponent } from 'overlayscrollbars-vue';
  import { onMounted, onUnmounted } from 'vue';
  import { closeDialog } from 'vue3-promise-dialog';

  interface Props
  {
    showCloseButton?: boolean;
  }

  const props = withDefaults(defineProps<Props>(), {
    showCloseButton: true
  });

  const handleClose = () =>
  {
    closeDialog();
  };

  const handleOverlayClick = () =>
  {
    if (props.showCloseButton)
    {
      handleClose();
    }
  };

  const handleKeydown = (event: KeyboardEvent) =>
  {
    if (event.key === 'Escape' && props.showCloseButton)
    {
      handleClose();
    }
  };

  onMounted(() =>
  {
    document.addEventListener('keydown', handleKeydown);
  });

  onUnmounted(() =>
  {
    document.removeEventListener('keydown', handleKeydown);
  });
</script>

<style scoped>
  .dialog-overlay
  {
    will-change: backdrop-filter;
  }

  .dialog-slide
  {
    animation: slideUp 300ms ease-out;
  }

  @keyframes slideUp
  {
    0%
    {
      transform: translateY(0.75rem);
    }
    100%
    {
      transform: translateY(0);
    }
  }
</style>
