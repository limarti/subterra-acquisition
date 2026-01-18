<template>
  <GeoGenericDialog :showCloseButton="false">
    <template #icon>
      <svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-white/50"/>
        <path d="M2 17L12 22L22 17" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-white/50"/>
        <path d="M2 12L12 17L22 12" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-white/50"/>
      </svg>
    </template>

    <template #title>
      Add Layer
    </template>

    <template #content>
      <div class="p-4">
        <label class="block text-white/80 text-sm mb-2">Layer name</label>
        <input
          ref="inputRef"
          v-model="layerName"
          type="text"
          class="w-full px-3 py-2 bg-background-darker border border-border-gray rounded text-white text-sm focus:outline-none focus:border-accent-primary"
          placeholder="Enter layer name"
          @keydown.enter="handleConfirm"
        />
      </div>

      <div class="flex justify-center gap-4 p-4">
        <button
          type="button"
          class="px-6 py-2 text-white/80 text-sm cursor-pointer hover:text-white transition"
          @click="handleCancel"
        >
          Cancel
        </button>
        <button
          type="button"
          class="px-6 py-2 bg-accent-primary text-background-darker text-sm rounded cursor-pointer hover:opacity-90 transition"
          :disabled="!layerName.trim()"
          :class="{ 'opacity-50 cursor-not-allowed': !layerName.trim() }"
          @click="handleConfirm"
        >
          Create
        </button>
      </div>
    </template>
  </GeoGenericDialog>
</template>

<script setup lang="ts">
  import { ref, onMounted } from 'vue';
  import { closeDialog } from 'vue3-promise-dialog';
  import GeoGenericDialog from '@/generic/components/GeoGenericDialog.vue';

  interface Props
  {
    defaultName: string;
  }

  const props = defineProps<Props>();

  const layerName = ref(props.defaultName);
  const inputRef = ref<HTMLInputElement | null>(null);

  onMounted(() =>
  {
    inputRef.value?.focus();
    inputRef.value?.select();
  });

  const handleConfirm = (): void =>
  {
    if (layerName.value.trim())
    {
      closeDialog(layerName.value.trim());
    }
  };

  const handleCancel = (): void =>
  {
    closeDialog(null);
  };

  defineExpose({ returnValue: () => null });
</script>

<style scoped>
  @reference "tailwindcss";
</style>
