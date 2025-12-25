<template>
  <IndicatorWrapper :buttonAriaLabel="'More menu'">
    <template #icon>
      <div class="relative w-5 h-5">
        <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" fill="none" stroke="#ffffff" stroke-width="1" stroke-linecap="round" stroke-linejoin="miter">
          <g stroke-width="0" />
          <g stroke-linecap="round" stroke-linejoin="round" />
          <g>
            <line x1="11.99" y1="6" x2="12" y2="6" stroke-linecap="round" stroke-width="2" />
            <line x1="11.99" y1="12" x2="12" y2="12" stroke-linecap="round" stroke-width="2" />
            <line x1="11.99" y1="18" x2="12" y2="18" stroke-linecap="round" stroke-width="2" />
          </g>
        </svg>
      </div>
    </template>

    <template #content="slotProps">
      <div class="p-3 min-w-48">
        <div class="flex items-center cursor-pointer transition hover:opacity-80"
             @click="handleShareClick(slotProps.contentProps?.close)">
          <div class="w-6 h-6 mr-5">
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <g stroke-width="0" />
              <g stroke-linecap="round" stroke-linejoin="round" />
              <g>
                <path d="M9.42857 12.875L14.5714 16.8125M14.5714 7.625L9.42857 11.125M6 12.0357V11.9643C6 11.0175 6.76751 10.25 7.71429 10.25C8.66106 10.25 9.42857 11.0175 9.42857 11.9643V12.0357C9.42857 12.9825 8.66106 13.75 7.71429 13.75C6.76751 13.75 6 12.9825 6 12.0357ZM14.5714 6.78571V6.71429C14.5714 5.76751 15.3389 5 16.2857 5C17.2325 5 18 5.76751 18 6.71429V6.78571C18 7.73249 17.2325 8.5 16.2857 8.5C15.3389 8.5 14.5714 7.73249 14.5714 6.78571ZM14.5714 17.2857V17.2143C14.5714 16.2675 15.3389 15.5 16.2857 15.5C17.2325 15.5 18 16.2675 18 17.2143V17.2857C18 18.2325 17.2325 19 16.2857 19C15.3389 19 14.5714 18.2325 14.5714 17.2857Z" stroke="#ffffff" stroke-linecap="round" stroke-linejoin="round" />
              </g>
            </svg>
          </div>
          <div class="flex-1 text-white text-sm">
            <span>{{ $t('project.share') }}</span>
          </div>
        </div>

        <div class="flex items-center cursor-pointer transition hover:opacity-80 mt-3"
             @click="handleDeleteClick(slotProps.contentProps?.close)">
          <div class="w-6 h-6 mr-5">
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M19 7L18.1327 19.1425C18.0579 20.1891 17.187 21 16.1378 21H7.86224C6.81296 21 5.94208 20.1891 5.86732 19.1425L5 7M10 11V17M14 11V17M15 7V4C15 3.44772 14.5523 3 14 3H10C9.44772 3 9 3.44772 9 4V7M4 7H20"
                    stroke="#ffffff"
                    stroke-width="1"
                    stroke-linecap="round"
                    stroke-linejoin="round" />
            </svg>
          </div>
          <div class="flex-1 text-white text-sm">
            <span>{{ $t('common.delete') }}</span>
          </div>
        </div>
      </div>
    </template>
  </IndicatorWrapper>
</template>

<script setup lang="ts">
  import IndicatorWrapper from '@/common/components/status-indicators/IndicatorWrapper.vue';

  interface Emits
  {
    share: [];
    delete: [];
  }

  const emit = defineEmits<Emits>();

  const handleShareClick = (close: () => void) =>
  {
    close();
    emit('share');
  };

  const handleDeleteClick = (close: () => void) =>
  {
    close();
    emit('delete');
  };
</script>
