declare module '*.vue' {
  import type { DefineComponent } from 'vue';
  const component: DefineComponent<any, any, any>;
  export default component;
}

declare module 'vue3-promise-dialog' {
  import type { Component } from 'vue';

  export interface DialogWrapperProps {
    /**
     * Transition attributes for dialog animations
     */
    transitionAttrs?: {
      name?: string;
      enterActiveClass?: string;
      enterFromClass?: string;
      enterToClass?: string;
      leaveActiveClass?: string;
      leaveFromClass?: string;
      leaveToClass?: string;
    };
  }

  export const DialogWrapper: Component<DialogWrapperProps>;

  /**
   * Opens a dialog component and returns a promise that resolves with the dialog's return value
   * @param component - The Vue component to render as a dialog
   * @param props - Props to pass to the dialog component
   * @returns Promise that resolves with the value returned by the dialog's returnValue() method
   */
  export function openDialog<T = any>(
    component: Component,
    props?: Record<string, any>
  ): Promise<T>;

  /**
   * Closes the currently open dialog and resolves the promise with the given result
   * @param result - The result to resolve the promise with
   */
  export function closeDialog<T = any>(result?: T): void;
}
