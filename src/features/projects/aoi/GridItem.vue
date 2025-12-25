<template>
  <div class="relative group"
       @click="handleClick"
       @mousedown="handleMouseDown"
       @mouseup="handleMouseUp"
       @touchstart="handleTouchStart"
       @touchend="handleTouchEnd">
    <div class="aspect-square bg-background-lighter border border-border-gray rounded-lg cursor-pointer transition-colors flex flex-col overflow-hidden"
         :class="[
           isSelected ? 'border-accent-primary bg-background-darker' : ''
         ]">
      <div class="flex-1 flex items-center justify-center p-4">
        <slot name="icon">
          <div class="flex items-center justify-center w-16 h-16 bg-background-darker rounded-lg">
            <svg class="w-10 h-10 text-text-secondary"
                 viewBox="0 0 24 24"
                 fill="none"
                 xmlns="http://www.w3.org/2000/svg">
              <rect x="4"
                    y="4"
                    width="16"
                    height="16"
                    stroke="currentColor"
                    stroke-width="2"
                    rx="2" />
            </svg>
          </div>
        </slot>
      </div>

      <!-- Horizontal divider -->
      <div class="border-t border-border-gray shrink-0" />

      <div class="p-4 flex items-center justify-center shrink-0">
        <span class="text-sm text-white text-center line-clamp-2">
          {{ item.name }}
        </span>
      </div>

      <div class="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
           :class="{ '!opacity-100': isMultiSelectMode || isSelected }"
           @click.stop="handleCheckboxClick">
        <div class="w-6 h-6 rounded border-2 flex items-center justify-center transition-all cursor-pointer"
             :class="[
               isSelected
                 ? 'bg-accent-primary border-accent-primary'
                 : 'bg-background-lighter border-border-gray'
             ]">
          <svg v-if="isSelected"
               class="w-4 h-4 text-white"
               viewBox="0 0 24 24"
               fill="none"
               xmlns="http://www.w3.org/2000/svg">
            <path d="M5 13L9 17L19 7"
                  stroke="currentColor"
                  stroke-width="3"
                  stroke-linecap="round"
                  stroke-linejoin="round" />
          </svg>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { ref } from 'vue';

  interface GridItemData
  {
    id: string;
    name: string;
  }

  interface Props
  {
    item: GridItemData;
    isSelected: boolean;
    isMultiSelectMode: boolean;
  }

  interface Emits
  {
    click: [itemId: string];
    checkboxClick: [itemId: string];
    longPress: [itemId: string];
  }

  const props = defineProps<Props>();
  const emit = defineEmits<Emits>();

  const pressTimer = ref<number | null>(null);
  const wasLongPress = ref(false);
  const LONG_PRESS_DURATION = 500; // milliseconds

  const handleClick = () =>
  {
    // Prevent click if it was a long press
    if (wasLongPress.value)
    {
      wasLongPress.value = false;
      return;
    }

    emit('click', props.item.id);
  };

  const handleCheckboxClick = () =>
  {
    emit('checkboxClick', props.item.id);
  };

  const handleMouseDown = () =>
  {
    wasLongPress.value = false;
    pressTimer.value = window.setTimeout(() =>
    {
      wasLongPress.value = true;
      emit('longPress', props.item.id);
    }, LONG_PRESS_DURATION);
  };

  const handleMouseUp = () =>
  {
    if (pressTimer.value)
    {
      clearTimeout(pressTimer.value);
      pressTimer.value = null;
    }
  };

  const handleTouchStart = () =>
  {
    wasLongPress.value = false;
    pressTimer.value = window.setTimeout(() =>
    {
      wasLongPress.value = true;
      emit('longPress', props.item.id);
    }, LONG_PRESS_DURATION);
  };

  const handleTouchEnd = () =>
  {
    if (pressTimer.value)
    {
      clearTimeout(pressTimer.value);
      pressTimer.value = null;
    }
  };
</script>
