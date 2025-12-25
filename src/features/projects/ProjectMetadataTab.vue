<template>
  <div class="px-6 py-4">
    <h2 class="text-xl font-semibold text-white mb-4">
      {{ $t('project.details') }}
    </h2>

    <div class="space-y-2">
      <div class="flex flex-col gap-1">
        <span class="text-text-secondary">{{ $t('project.fields.name') }}:</span>
        <input v-if="editingField === 'name'"
               ref="nameInputRef"
               v-model="localProject.name"
               type="text"
               class="px-2 py-1 bg-background-lighter border border-border-gray rounded-md text-white focus:outline-none min-w-48"
               @keyup.enter="handleSave"
               @keyup.escape="cancelEditing">
        <span v-else
              class="text-white cursor-pointer hover:text-accent-info px-2 py-1 min-w-48 text-right"
              @click="startEditing('name')">
          {{ project.name || '-' }}
        </span>
      </div>
      <div class="flex flex-col gap-1">
        <span class="text-text-secondary">{{ $t('project.created') }}:</span>
        <span class="text-white px-2 py-1">{{ formatDate(project.dateCreated) }}</span>
      </div>
    </div>

    <p v-if="errorMessage" class="text-sm text-red-400 mt-2">
      {{ errorMessage }}
    </p>

    <div v-if="isEditing" class="flex gap-2 pb-4 mt-4">
      <button class="px-4 py-2 bg-accent-info text-white rounded-full text-sm"
              @click="handleSave">
        {{ $t('common.save') }}
      </button>
      <button class="px-4 py-2 bg-background-lighter text-white rounded-full text-sm border border-border-gray"
              @click="cancelEditing">
        {{ $t('common.cancel') }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { ref, computed, nextTick, reactive } from 'vue';
  import { useI18n } from 'vue-i18n';
  import type { ProjectMetadata } from './ProjectMetadata.type';
  import { validateProjectName } from './projectFieldsValidation';

  interface Props
  {
    project: ProjectMetadata;
  }

  interface Emits
  {
    save: [Partial<ProjectMetadata>];
  }

  const props = defineProps<Props>();
  const emit = defineEmits<Emits>();
  const { t } = useI18n();

  type EditableField = 'name';

  const localProject = reactive({
    name: props.project.name
  });

  const editingField = ref<EditableField | null>(null);
  const errorMessage = ref('');

  const nameInputRef = ref<HTMLInputElement | null>(null);

  const isEditing = computed(() => editingField.value !== null);

  const startEditing = async (field: EditableField) =>
  {
    editingField.value = field;
    errorMessage.value = '';

    await nextTick();

    nameInputRef.value?.focus();
    nameInputRef.value?.select();
  };

  const cancelEditing = () =>
  {
    localProject.name = props.project.name;

    editingField.value = null;
    errorMessage.value = '';
  };

  const handleSave = () =>
  {
    const error = validateProjectName(localProject.name);

    if (error)
    {
      errorMessage.value = t(error.key, error.params ?? {});
      return;
    }

    localProject.name = localProject.name.trim();

    emit('save', { ...localProject });

    editingField.value = null;
    errorMessage.value = '';
  };

  const formatDate = (timestamp: number): string =>
  {
    return new Date(timestamp).toLocaleString();
  };
</script>
