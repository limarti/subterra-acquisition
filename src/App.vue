<template>
  <DebugWrapper>
    <div class="h-full w-full bg-background @container mx-auto font-normal">
      <RouterView v-slot="{ Component, route }">
        <Transition mode="out-in"
                    enterActiveClass="transition-opacity duration-300"
                    enterFromClass="opacity-0"
                    enterToClass="opacity-100"
                    leaveActiveClass="transition-opacity duration-200"
                    leaveFromClass="opacity-100"
                    leaveToClass="opacity-0">
          <component :is="Component" :key="route.path + JSON.stringify(route.query)" />
        </Transition>

        <DialogWrapper :transitionAttrs="{
          name: 'dialog-fade',
          enterActiveClass: 'transition-opacity duration-200 ease-out',
          enterFromClass: 'opacity-0',
          enterToClass: 'opacity-100',
          leaveActiveClass: 'transition-opacity duration-200 ease-out',
          leaveFromClass: 'opacity-100',
          leaveToClass: 'opacity-0'
        }" />
      </RouterView>

      <div class="absolute top-4 left-1/2 transform -translate-x-1/2 flex flex-col items-center gap-2">
        <TransitionGroup enterActiveClass="transition-opacity duration-300"
                         enterFromClass="opacity-0"
                         enterToClass="opacity-100"
                         leaveActiveClass="transition-opacity duration-200"
                         leaveFromClass="opacity-100"
                         leaveToClass="opacity-0">
          <component :is="toast.component"
                     v-for="toast in toasts"
                     :key="toast.id"
                     v-bind="toast.props"
                     @close="dismiss(toast.id)" />
        </TransitionGroup>
      </div>

      <FloatingConsole :isActivated="isDebugConsoleActivated" />
    </div>
  </DebugWrapper>
</template>

<script setup lang="ts">

  import { ref, provide } from 'vue';
  import { RouterView } from 'vue-router';
  import DebugWrapper from '@/common/components/DebugWrapper.vue';
  import FloatingConsole from '@/common/components/FloatingConsole.vue';
  import { useToast } from '@/common/composables/useToast';
  import { useAppFullscreen } from '@/common/composables/useAppFullscreen';
  import { DialogWrapper } from 'vue3-promise-dialog';

  const { toasts, dismiss } = useToast();
  useAppFullscreen();

  const isDebugConsoleActivated = ref(false);
  provide('isDebugConsoleActivated', isDebugConsoleActivated);

</script>

<style>
/* Tailwind CSS imports handled in base.css */
</style>
