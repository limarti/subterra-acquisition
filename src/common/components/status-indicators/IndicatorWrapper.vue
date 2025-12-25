<template>
  <GeoPopper placement="bottom-end"
             offsetDistance="0"
             :offsetSkidding="0">
    <button type="button"
            class="p-2 flex justify-center items-center transition-colors duration-200 border-l border-border-gray cursor-pointer hover:bg-toolbar-dark-hover"
            :aria-label="buttonAriaLabel">
      <slot name="icon" />
    </button>

    <template #content="contentProps">
      <div v-if="hasContent"
           class="bg-background border border-accent-attention rounded shadow-lg mx-2">
        <slot name="content" :contentProps="contentProps" />
      </div>
    </template>
  </GeoPopper>
</template>

<script setup lang="ts">
  import GeoPopper from '../GeoPopper.vue';
  import { useSlots, computed } from 'vue';

  interface Props
  {
    buttonAriaLabel: string;
  }

  defineProps<Props>();

  defineSlots<{
    content: any;
    contentProps(props: { close: () => void; isOpen: boolean; }): any
    icon(): any
  }>();

  const slots = useSlots();

  // Check if content slot has any content
  const hasContent = computed(() =>
  {
    const content = slots.content?.();
    return content && content.length > 0;
  });
</script>

