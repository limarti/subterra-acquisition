<template>
  <div class="dialog-overlay overflow-hidden absolute inset-0 backdrop-blur-xs bg-black/50 flex items-center justify-center transition-opacity duration-200 ease-out dialog-fade" @click="handleOverlayClick" @keydown.escape="handleCancel">
    <div class="bg-background-lighter border border-border-gray rounded-md mx-1 shadow-[0_8px_48px_0_rgba(0,0,0,0.5)] max-h-[calc(100%-1rem)] flex flex-col dialog-fade" @click.stop>

      <!-- header -->
      <div class="flex justify-start items-center p-4 border-b shrink-0">
        <div class="flex items-center">
          <slot name="icon" />
        </div>

        <div class="ml-4 flex items-center">
          <h3 class="text-xl text-white/80 font-semibold">
            <slot name="title" />
          </h3>
        </div>
      </div>

      <!-- content with buttons -->
      <OverlayScrollbarsComponent class="flex-1 bg-background-darker">
        <div class="p-6">
          <slot name="content" />
        </div>
      </OverlayScrollbarsComponent>

      <!-- action buttons -->
      <div class="flex justify-center gap-4 my-5 px-6 shrink-0">
        <button class="cursor-pointer px-6 py-2 text-white rounded-md bg-background flex-1"
                @click="handleCancel">
          {{ props.cancelText }}
        </button>
        <button class="cursor-pointer px-6 py-2 text-white rounded-md bg-accent-info flex-1"
                @click="handleOk">
          {{ props.okText }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { onMounted, onUnmounted } from 'vue';
  import { closeDialog } from 'vue3-promise-dialog';
  import { OverlayScrollbarsComponent } from 'overlayscrollbars-vue';

  interface Props
  {
    cancelText: string;
    okText: string;
  }

  interface Emits
  {
    confirm: [];
  }

  const props = defineProps<Props>();
  const emit = defineEmits<Emits>();

  const handleCancel = () =>
  {
    closeDialog();
  };

  const handleOk = () =>
  {
    emit('confirm');
  };

  const handleOverlayClick = () =>
  {
    handleCancel();
  };

  const handleKeydown = (event: KeyboardEvent) =>
  {
    if (event.key === 'Escape')
    {
      handleCancel();
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
    will-change: opacity;
  }

  .dialog-fade
  {
    animation: fadeIn 200ms ease-out;
  }

  @keyframes fadeIn
  {
    0%
    {
      opacity: 0;
    }
    100%
    {
      opacity: 1;
    }
  }
</style>
