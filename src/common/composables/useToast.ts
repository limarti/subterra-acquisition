import { ref, readonly, onMounted, onUnmounted, markRaw, type Component } from 'vue';

export interface Toast
{
  id: string;
  component: Component;
  props?: Record<string, any>;
  autoDismiss?: number | false;
  timer?: ReturnType<typeof setTimeout>;
}

// Shared toasts are necessary since all are being rendered in a single global container (App.vue). A global toast state ensures all components
// see the same toast queue
const toasts = ref<Toast[]>([]);

export const useToast = () =>
{
  const dismiss = (id: string) =>
  {
    const toast = toasts.value.find(t => t.id === id);
    if (toast?.timer)
    {
      clearTimeout(toast.timer);
    }
    toasts.value = toasts.value.filter(t => t.id !== id);
  };

  const show = (component: Component, props = {}, autoDismiss = 5000) =>
  {
    const rawComponent = markRaw(component);
    const existingToast = toasts.value.find(t => t.component === rawComponent);

    if (existingToast)
    {
      // Clear old timer and update existing toast
      if (existingToast.timer) clearTimeout(existingToast.timer);
      existingToast.props = props;
      existingToast.autoDismiss = autoDismiss;
      if (autoDismiss)
      {
        existingToast.timer = setTimeout(() => dismiss(existingToast.id), autoDismiss);
      }
      else
      {
        delete existingToast.timer;
      }
      return existingToast.id;
    }

    // Create new toast
    const id = crypto.randomUUID();
    const newToast: Toast = { id, component: rawComponent, props, autoDismiss };
    if (autoDismiss)
    {
      newToast.timer = setTimeout(() => dismiss(id), autoDismiss);
    }
    toasts.value.push(newToast);
    return id;
  };

  return { toasts: readonly(toasts), show, dismiss };
};
