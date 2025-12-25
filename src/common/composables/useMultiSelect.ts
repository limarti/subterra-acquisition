import { ref, readonly } from 'vue';

/**
 * Composable for managing multi-select behavior with long press activation
 *
 * @returns Multi-select state and handlers
 */
export const useMultiSelect = () =>
{
  const idSelectedItems = ref<Set<string>>(new Set());
  const isMultiSelectMode = ref(false);

  /**
   * Check if an item is currently selected
   */
  const isItemSelected = (itemId: string): boolean =>
  {
    return idSelectedItems.value.has(itemId);
  };

  /**
   * Handle item click - toggles selection in multi-select mode, or executes navigation callback
   */
  const handleItemClick = (itemId: string, onNavigate?: () => void) =>
  {
    if (isMultiSelectMode.value)
    {
      // Multi-select mode: toggle selection
      if (idSelectedItems.value.has(itemId))
      {
        idSelectedItems.value.delete(itemId);
      }
      else
      {
        idSelectedItems.value.add(itemId);
      }
    }
    else
    {
      // Normal mode: execute navigation callback if provided
      onNavigate?.();
    }
  };

  /**
   * Handle checkbox click - always toggles selection
   */
  const handleCheckboxClick = (itemId: string) =>
  {
    if (idSelectedItems.value.has(itemId))
    {
      idSelectedItems.value.delete(itemId);
    }
    else
    {
      idSelectedItems.value.add(itemId);
    }
  };

  /**
   * Handle item long press - toggles multi-select mode
   */
  const handleItemLongPress = (itemId: string) =>
  {
    // Toggle multi-select mode
    isMultiSelectMode.value = !isMultiSelectMode.value;

    if (isMultiSelectMode.value)
    {
      // Entering multi-select mode: select the long-pressed item if not already selected
      if (!idSelectedItems.value.has(itemId))
      {
        idSelectedItems.value.add(itemId);
      }
    }
    else
    {
      // Exiting multi-select mode: clear all selections
      idSelectedItems.value.clear();
    }
  };

  /**
   * Clear all selections and exit multi-select mode
   */
  const clearSelection = () =>
  {
    idSelectedItems.value.clear();
    isMultiSelectMode.value = false;
  };

  /**
   * Get array of selected item IDs
   */
  const getSelectedIds = (): string[] =>
  {
    return Array.from(idSelectedItems.value);
  };

  return {
    idSelectedItems: readonly(idSelectedItems),
    isMultiSelectMode: readonly(isMultiSelectMode),
    isItemSelected,
    handleItemClick,
    handleCheckboxClick,
    handleItemLongPress,
    clearSelection,
    getSelectedIds
  };
};
