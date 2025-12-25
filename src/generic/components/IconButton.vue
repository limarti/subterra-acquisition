<template>
  <div :class="[
         'w-16 h-16',
         disabled ? 'cursor-not-allowed' : 'cursor-pointer hover:drop-shadow-md hover:drop-shadow-white/20'
       ]"
       @click="handleClick">
    <div class="relative w-full h-full">
      <!-- Dark background layer -->
      <div class="absolute w-full h-full rounded-full bg-gray-500" />

      <!-- Button layers with opacity when disabled -->
      <div :class="disabled ? 'opacity-50' : ''">
        <div :class="['absolute w-full h-full rounded-full bg-accent-primary']" />
        <div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-14 h-14 rounded-full bg-black" />
        <div :class="['absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-accent-primary']" />
        <div :class="['absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2']">
          <slot />
        </div>
      </div>
    </div>

  </div>
</template>

<script setup lang="ts">

  interface Props {
    disabled?: boolean;
  }

  const props = withDefaults(defineProps<Props>(), {
    disabled: false
  });

  const emit = defineEmits<{
    click: []
  }>();

  const handleClick = () =>
  {
    if (!props.disabled)
    {
      emit('click');
    }
  };
</script>
