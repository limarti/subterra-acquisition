<template>
  <span ref="triggerRef" class="" @click="toggle">
    <slot />
  </span>

  <Teleport to="body">
    <div v-if="isOpen"
         ref="popperRef"
         class="fixed z-[9999]">
      <div ref="arrowRef" class="popper-arrow" />
      <slot name="content" :close="close" />
    </div>
  </Teleport>
</template>

<script setup lang="ts">
  import { ref, watch, onBeforeUnmount, nextTick } from 'vue';
  import { createPopper, type Instance, type Placement } from '@popperjs/core';

  interface Props
  {
    placement?: Placement;
    offsetDistance?: number | string;
    offsetSkidding?: number | string;
  }

  const props = withDefaults(defineProps<Props>(), {
    placement: 'bottom-end',
    offsetDistance: 12,
    offsetSkidding: 0
  });

  const triggerRef = ref<HTMLElement | null>(null);
  const popperRef = ref<HTMLElement | null>(null);
  const arrowRef = ref<HTMLElement | null>(null);
  const isOpen = ref(false);
  let popperInstance: Instance | null = null;

  const toggle = () => { isOpen.value = !isOpen.value; };
  const close = () => { isOpen.value = false; };

  const handleClickOutside = (e: MouseEvent) =>
  {
    const target = e.target as Node;
    if (!triggerRef.value?.contains(target) && !popperRef.value?.contains(target))
    {
      close();
    }
  };

  watch(isOpen, async (open) =>
  {
    if (open)
    {
      await nextTick();
      if (triggerRef.value && popperRef.value)
      {
        popperInstance = createPopper(triggerRef.value, popperRef.value, {
          placement: props.placement,
          strategy: 'fixed',
          modifiers: [
            {
              name: 'offset',
              options: { offset: [Number(props.offsetSkidding), Number(props.offsetDistance)] }
            },
            {
              name: 'arrow',
              options: { element: arrowRef.value }
            }
          ]
        });
      }
      document.addEventListener('click', handleClickOutside, true);
    }
    else
    {
      popperInstance?.destroy();
      popperInstance = null;
      document.removeEventListener('click', handleClickOutside, true);
    }
  });

  onBeforeUnmount(() =>
  {
    popperInstance?.destroy();
    document.removeEventListener('click', handleClickOutside, true);
  });
</script>

<style>
.popper-arrow {
  --arrow-size: 0.625rem;
  position: absolute;
  width: var(--arrow-size);
  height: var(--arrow-size);
  background: var(--color-accent-attention);
}

[data-popper-placement^='bottom'] > .popper-arrow {
  bottom: 100%;
  transform: translateX(-50%);
  clip-path: polygon(50% 0%, 0% 100%, 100% 100%);
}

[data-popper-placement^='top'] > .popper-arrow {
  top: 100%;
  transform: translateX(-50%);
  clip-path: polygon(50% 100%, 0% 0%, 100% 0%);
}

[data-popper-placement^='left'] > .popper-arrow {
  left: 100%;
  transform: translateY(-50%);
  clip-path: polygon(100% 50%, 0% 0%, 0% 100%);
}

[data-popper-placement^='right'] > .popper-arrow {
  right: 100%;
  transform: translateY(-50%);
  clip-path: polygon(0% 50%, 100% 0%, 100% 100%);
}
</style>
