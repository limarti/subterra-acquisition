import { openDialog } from 'vue3-promise-dialog';
import type { Component } from 'vue';

export const useDialog = () =>
{
  const open = <T = any>(component: Component, props?: Record<string, any>): Promise<T> =>
  {
    return openDialog<T>(component, props);
  };

  return {
    open
  };
};
