<template>
  <div class="flex items-center justify-between py-3 border-b-1 hover:bg-background-darker-darker cursor-pointer transition"
       @click="handleClick">
    <!-- Icon Slot -->
    <div class="ml-3" :class="$slots.icon ? 'flex-shrink-0 w-6 h-6 mr-3' : ''">
      <slot name="icon" />
    </div>

    <!-- Title -->
    <div class="flex-1 text-white/80 text-sm">
      {{ title }}
    </div>

    <!-- Radio Button -->
    <div class="flex-shrink-0 mr-3">
      <div class="w-4 h-4 rounded-full border-1 flex items-center justify-center"
           :class="isSelected
             ? 'border-accent-primary'
             : 'border-white'">
        <div v-if="isSelected"
             class="w-2 h-2 rounded-full bg-accent-primary" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
  interface Props
  {
    title: string;
    isSelected: boolean;
  }

  interface Emits
  {
    click: [];
  }

  const props = defineProps<Props>();
  const emit = defineEmits<Emits>();

  const handleClick = (): void =>
  {
    emit('click');
  };
</script>
