import { onUnmounted } from 'vue';

/**
 * Creates a debounced function that delays invoking the callback until after
 * the specified delay has elapsed since the last time it was invoked.
 * Automatically cleans up pending timeouts on component unmount.
 *
 * @param callback - The function to debounce
 * @param delay - The delay in milliseconds (default: 500ms)
 * @returns A debounced version of the callback function
 */
export const useDebounce = <T extends (...args: any[]) => any>(
  callback: T,
  delay: number = 500
): ((...args: Parameters<T>) => void) =>
{
  let timeoutId: ReturnType<typeof setTimeout> | null = null;

  const debouncedFunction = (...args: Parameters<T>): void =>
  {
    if (timeoutId !== null)
    {
      clearTimeout(timeoutId);
    }

    timeoutId = setTimeout(() =>
    {
      callback(...args);
      timeoutId = null;
    }, delay);
  };

  const cleanup = (): void =>
  {
    if (timeoutId !== null)
    {
      clearTimeout(timeoutId);
      timeoutId = null;
    }
  };

  onUnmounted(cleanup);

  return debouncedFunction;
};
