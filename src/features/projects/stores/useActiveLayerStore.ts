import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import type { Layer } from '../objects/ProjectObject.type';
import type { ProjectMetadata } from '../ProjectMetadata.type';

/**
 * Active Layer Store
 *
 * Manages the currently active layer for EML recording.
 * Active layer selection is stored in memory only (not persisted).
 */
export const useActiveLayerStore = defineStore('activeLayer', () =>
{
  // ===== STATE =====
  const activeLayerId = ref<string | null>(null);

  // ===== ACTIONS =====
  const setActiveLayer = (layerId: string | null): void =>
  {
    activeLayerId.value = layerId;
  };

  const clearActiveLayer = (): void =>
  {
    activeLayerId.value = null;
  };

  /**
   * Get the active layer from a project
   * @param project - The project to search in
   * @returns The active layer or null if not found
   */
  const getActiveLayer = (project: ProjectMetadata | null): Layer | null =>
  {
    if (!project || !activeLayerId.value)
    {
      return null;
    }

    return project.layers.find(layer => layer.id === activeLayerId.value) ?? null;
  };

  /**
   * Ensure active layer is valid for the given project.
   * If the current active layer doesn't exist in the project,
   * selects the first layer or clears the selection.
   */
  const validateActiveLayer = (project: ProjectMetadata | null): void =>
  {
    if (!project)
    {
      clearActiveLayer();
      return;
    }

    const layers = project.layers;

    // If no layers exist, clear selection
    if (layers.length === 0)
    {
      clearActiveLayer();
      return;
    }

    // If no active layer selected, select first layer
    if (activeLayerId.value === null)
    {
      activeLayerId.value = layers[0]!.id;
      return;
    }

    // If active layer no longer exists, select first layer
    const activeLayerExists = layers.some(layer => layer.id === activeLayerId.value);
    if (!activeLayerExists)
    {
      activeLayerId.value = layers[0]!.id;
    }
  };

  return {
    // State
    activeLayerId: computed(() => activeLayerId.value),

    // Actions
    setActiveLayer,
    clearActiveLayer,
    getActiveLayer,
    validateActiveLayer
  };
});
